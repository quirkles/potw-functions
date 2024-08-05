import {onRequest} from "firebase-functions/v2/https";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {users} from "../../db/schema/user";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {eq} from "drizzle-orm";
import {periodSchema} from "./transforms";
import {getIdFromSqlId} from "../../services/firestore/user";
import {initializeAppAdmin} from "../../services/firebase";
import {createLogger} from "../../services/Logger/Logger.pino";
import {getConfig} from "../../config";
import {v4} from "uuid";

export const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  adminId: z.string(),
  startDate: z.string(),
  endDate: z.string().or(z.null()),
  addAdminAsPlayer: z.boolean(),
  period: periodSchema,
});

export const createGame = onRequest(async (req, res) => {
  initializeAppAdmin();
  const logger = createLogger({
    logName: "createGame",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: req.headers["x-correlation-id"] as string || v4(),
    },
  });
  const db = getDb();
  const validated = createGamePayloadSchema.parse(req.body);
  logger.info("createGame: begin", {
    payload: validated,
  });
  let newGameId;
  let admin;
  const periodString: string = typeof validated.period === "string" ?
    validated.period :
    "quantity" in validated.period ?
      `${validated.period.quantity}-${validated.period.unit}` :
      `${validated.period.recurrence}-${validated.period.dayOfWeek}`;

  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: validated.name,
      description: validated.description,
      isPrivate: validated.isPrivate,
      adminId: validated.adminId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      period: periodString,
    }).returning({
      insertedId: games.id,
    });
    logger.info("createGame: game inserted", {
      inserted,
    });
    admin = await tx.select().from(users).where(eq(users.id, validated.adminId)).limit(1);
    if (admin.length === 0) {
      logger.warning("createGame: admin not found");
      throw new Error("Admin not found");
    }
    const {
      id: sqlId,
      email,
      username= null,
    } = admin[0];
    const firestoreId = await getIdFromSqlId(sqlId);
    if (firestoreId === null) {
      logger.warning("createGame: admin not found in Firestore");
      throw new Error("Admin not found in Firestore");
    }
    admin = {
      sqlId,
      email,
      firestoreId,
      username,
    };
    logger.info("createGame: admin found", {
      admin,
    });
    newGameId = inserted.insertedId;
    if (validated.addAdminAsPlayer) {
      await tx.insert(gamesToUsers).values({
        gameId: newGameId,
        userId: validated.adminId,
      });
    }
  });
  res.status(201).send({
    id: newGameId,
    admin,
    ...validated,
  });
});
