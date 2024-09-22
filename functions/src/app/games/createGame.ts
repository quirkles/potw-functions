import {eq} from "drizzle-orm";
import {inArray} from "drizzle-orm/sql/expressions/conditions";
import {getFirestore} from "firebase-admin/firestore";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {initializeAppAdmin} from "../../services/firebase";
import {getIdFromSqlId} from "../../services/firestore/user";
import {initializeGameWeeksForGame} from "../../services/games/intializeNextGameWeeks";
import {inviteUsers} from "../../services/users/inviteUsers";
import {ServerError} from "../../utils/Errors";
import {gameSchema, PeriodString} from "../../validation/game";
import {User, userSchema} from "../../validation/user";

import {createGamePayloadSchema} from "./schemas";
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
  let newGameCreatedAt: string | null = null;
  let newGameUpdatedAt: string | null = null;
  let admin: User | null = null;
  const periodString: PeriodString = periodToPeriodString(body.period);

  const existingUserIds: string[] = [];
  const usersToInvite: string[] = [];

  let existingUsers: User[] = [];
  let invitedUsers: User[] = [];

  for (const player of body.players) {
    if (player.firestoreId) {
      existingUserIds.push(player.firestoreId);
    } else {
      usersToInvite.push(player.email);
    }
  }

  logger.info("createGame: inserting game", {
    body,
    existingUserIds,
    usersToInvite,
  });

  const newGameRef = getFirestore().collection("games").doc();

  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: body.name,
      firestoreId: newGameRef.id,
      description: body.description,
      isPrivate: body.isPrivate,
      adminId: body.adminId,
      startDate: body.startDate,
      endDate: body.endDate,
      period: periodString,
    }).returning({
      insertedId: games.id,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
    });
    logger.info("createGame: game inserted", {
      inserted,
    });
    await newGameRef.set({
      sqlId: inserted.insertedId,
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
      createdAt,
      updatedAt,
      aboutMe,
      avatarUrl,
    } = adminResults[0];
    invitedUsers = await inviteUsers(usersToInvite, email);
    logger.info("createGame: looking for existing users", {
      existingUserIds,
    });
    existingUsers = existingUserIds.length ? await tx.select().from(users).where(inArray(
      users.firestoreId,
      existingUserIds,
    )).then((results) => results.map((result) => userSchema.parse({
      ...result,
      sqlId: result.id,
    }))).catch((err) => {
      logger.error("createGame: Error fetching existing users", {
        lookingFor: existingUserIds,
        err,
      });
      throw new ServerError("Error fetching existing users");
    }) : [];
    logger.info("createGame: found existing users. Getting admin firestoreId", {existingUsers, adminSqlId: sqlId});
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
      createdAt,
      updatedAt,
      aboutMe,
      avatarUrl,
    };
    logger.info("createGame: admin found", {
      admin,
    });
    newGameId = inserted.insertedId;
    newGameCreatedAt = inserted.createdAt;
    newGameUpdatedAt = inserted.updatedAt;
    const playerIds: string[] = [
      ...existingUsers.map((user) => user.sqlId),
      ...invitedUsers.map((user) => user.sqlId),
    ];
    if (body.addAdminAsPlayer) {
      playerIds.push(body.adminId);
      existingUsers.push(admin);
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
  const gameWeeks = await initializeGameWeeksForGame(newGameId, 2);
  if (newGameCreatedAt === null || newGameUpdatedAt === null) {
    logger.warning("createGame: game not created");
    throw new Error("Game missing dates");
  }
  return {
    response: {
      ...body,
      sqlId: newGameId,
      firestoreId: newGameRef.id,
      period: periodString,
      id: newGameId,
      admin,
      gameWeeks,
      createdAt: newGameCreatedAt as string,
      updatedAt: newGameUpdatedAt as string,
      adminSqlId: body.adminId,
      players: [
        ...existingUsers,
        ...invitedUsers,
      ],
    },
  };
}, {
  bodySchema: createGamePayloadSchema,
  responseSchema: gameSchema,
});
