import {inArray} from "drizzle-orm/sql/expressions/conditions";
import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {SelectUser, users} from "../../db/schema/user";
import {gamesToUsers} from "../../db/schema/games_to_users";

import {getIdFromSqlId} from "../../services/firestore/user";
import {initializeAppAdmin} from "../../services/firebase";

import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {inviteUsers} from "../../services/users/inviteUsers";
import {createGamePayloadSchema, gameSchema, PeriodString} from "./schemas";
import {periodToPeriodString} from "./transforms";

export const createGame = httpHandler(async ({
  body,
}) => {
  initializeAppAdmin();
  const logger = getLogger();
  const db = getDb();
  logger.info("createGame: begin", {
    payload: body || "none",
  });
  let newGameId: string | null = null;
  let admin: Omit<SelectUser, "id"> & { sqlId: string } | null = null;
  const periodString: PeriodString = periodToPeriodString(body.period);

  const existingUserIds: string[] = [];
  const usersToInvite: string[] = [];

  let existingUsers: SelectUser[] = [];
  let invitedUsers: SelectUser[] = [];

  for (const player of body.players) {
    if (player.firestoreId) {
      existingUserIds.push(player.firestoreId);
    } else {
      usersToInvite.push(player.email);
    }
  }


  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: body.name,
      description: body.description,
      isPrivate: body.isPrivate,
      adminId: body.adminId,
      startDate: body.startDate,
      endDate: body.endDate,
      period: periodString,
    }).returning({
      insertedId: games.id,
    });
    logger.info("createGame: game inserted", {
      inserted,
    });
    const adminResults = await tx.select().from(users).where(eq(users.id, body.adminId)).limit(1);
    if (adminResults.length === 0) {
      logger.warning("createGame: admin not found");
      throw new Error("Admin not found");
    }
    const {
      id: sqlId,
      email,
      username = null,
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
    existingUsers = existingUserIds.length ? await tx.select().from(users).where(inArray(
      users.firestoreId,
      existingUserIds,
    )) : [];
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
    if (body.addAdminAsPlayer) {
      playerIds.push(body.adminId);
    }
    logger.info("createGame: inserting gamesToUsers", {
      gameId: newGameId,
      playerIds,
    });
    if (playerIds.length > 0) {
      await tx.insert(gamesToUsers)
        .values(
          playerIds.map(
            (playerId) => ({
              gameId: newGameId as string,
              userId: playerId,
            })
          )
        );
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
    response: {
      ...body,
      id: newGameId,
      admin,
      players: [
        ...existingUsers,
        ...invitedUsers,
      ].map((user) => ({
        email: user.email,
        firestoreId: user.firestoreId,
        sqlId: user.id,
        username: user.username || null,
      })),
    },
  };
}, {
  bodySchema: createGamePayloadSchema,
  responseSchema: gameSchema,
});
