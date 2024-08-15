import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {SelectUser, users} from "../../db/schema/user";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {eq} from "drizzle-orm";
import {periodSchema} from "./transforms";
import {getIdFromSqlId} from "../../services/firestore/user";
import {initializeAppAdmin} from "../../services/firebase";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";

export const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().or(z.null()),
  isPrivate: z.boolean(),
  adminId: z.string(),
  startDate: z.string(),
  endDate: z.string().or(z.null()),
  addAdminAsPlayer: z.boolean(),
  period: periodSchema,
  players: z.array(z.object({
    email: z.string(),
    id: z.string().or(z.null()),
  })),
});

const createGameReturnSchema = createGamePayloadSchema.extend({
  id: z.string(),
  admin: z.object({
    sqlId: z.string(),
    email: z.string(),
    firestoreId: z.string(),
    username: z.string().optional(),
  }),
});

export const createGame = httpHandler(async (payload) => {
  initializeAppAdmin();
  const logger = getLogger();
  const db = getDb();
  logger.info("createGame: begin", {
    payload: payload || "none",
  });
  let newGameId: string | null = null;
  let admin: Omit<SelectUser, "id"> & { sqlId: string } | null = null;
  const periodString: string = typeof payload.period === "string" ?
    payload.period :
    "quantity" in payload.period ?
      `${payload.period.quantity}-${payload.period.unit}` :
      `${payload.period.recurrence}-${payload.period.dayOfWeek}`;

  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: payload.name,
      description: payload.description,
      isPrivate: payload.isPrivate,
      adminId: payload.adminId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      period: periodString,
    }).returning({
      insertedId: games.id,
    });
    logger.info("createGame: game inserted", {
      inserted,
    });
    const adminResults = await tx.select().from(users).where(eq(users.id, payload.adminId)).limit(1);
    if (adminResults.length === 0) {
      logger.warning("createGame: admin not found");
      throw new Error("Admin not found");
    }
    const {
      id: sqlId,
      email,
      username= null,
    } = adminResults[0];
    const firestoreId = await getIdFromSqlId(sqlId);
    if (firestoreId === null) {
      logger.warning("createGame: admin not found in Firestore");
      throw new Error("Admin not found in Firestore");
    }
    admin = {
      sqlId,
      email,
      firestoreId,
      username: username || email,
    };
    logger.info("createGame: admin found", {
      admin,
    });
    newGameId = inserted.insertedId;
    if (payload.addAdminAsPlayer) {
      await tx.insert(gamesToUsers).values({
        gameId: newGameId,
        userId: payload.adminId,
      });
    }
  });
  if (newGameId === null) {
    logger.warning("createGame: game not created");
    throw new Error("Game not created");
  }
  if (admin === null) {
    logger.warning("createGame: admin not found");
    throw new Error("Admin not found");
  }
  return {
    id: newGameId,
    admin,
    ...payload,
  };
}, {
  payloadSchema: createGamePayloadSchema,
  responseSchema: createGameReturnSchema,
});
