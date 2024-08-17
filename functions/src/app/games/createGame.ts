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
import {inviteUsers} from "../../services/users/inviteUsers";
import {inArray} from "drizzle-orm/sql/expressions/conditions";

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
    firestoreId: z.string().or(z.null()),
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
  players: z.array(z.object({
    email: z.string(),
    fireStoreId: z.string().or(z.null()),
    sqlId: z.string().or(z.null()),
  })),
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

  const existingUserIds: string[] = [];
  const usersToInvite: string[] = [];

  let existingUsers: SelectUser[] = [];
  let invitedUsers: SelectUser[] = [];

  for (const player of payload.players) {
    if (player.firestoreId) {
      existingUserIds.push(player.firestoreId);
    } else {
      usersToInvite.push(player.email);
    }
  }


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
    invitedUsers = await inviteUsers(usersToInvite, email).then((users) => {
      logger.info("createGame: invited users", {
        users,
      });
      return users.map((user) => ({
        ...user,
        username: null,
        id: user.sqlId,
      }));
    });
    existingUsers = await tx.select().from(users).where(inArray(
      users.firestoreId,
      existingUserIds,
    ));
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
    const playerIds: string[] = [
      ...existingUsers.map((user) => user.id),
      ...invitedUsers.map((user) => user.id),
    ];
    if (payload.addAdminAsPlayer) {
      playerIds.push(payload.adminId);
    }
    logger.info("createGame: inserting gamesToUsers", {
      gameId: newGameId,
      playerIds,
    });
    await tx.insert(gamesToUsers)
      .values(
        playerIds.map(
          (playerId) => ({
            gameId: newGameId as string,
            userId: playerId,
          })
        )
      );
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
    ...payload,
    id: newGameId,
    admin,
    players: [
      ...existingUsers,
      ...invitedUsers,
    ].map((user) => ({
      email: user.email,
      fireStoreId: user.firestoreId,
      sqlId: user.id,
    })),
  };
}, {
  payloadSchema: createGamePayloadSchema,
  responseSchema: createGameReturnSchema,
});
