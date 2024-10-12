import {desc, eq} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {gamesToUsers} from "../../db/schema/gamesToUsers";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {Game, gameSchema} from "../../validation/game";
import {GameWeek, gameWeekSchema} from "../../validation/gameWeek";
import {User, userSchema} from "../../validation/user";
import {gameWithRelationsSchema} from "../../validation/withRelations";

export const fetchOne = httpHandler(async ({query}) => {
  const logger = getLogger();
  const db = getDb();
  logger.info("fetchOne: begin", {
    query: query || "none",
  });
  const admin = alias(users, "admin");

  const gameWeeksSubQuery = db.select()
    .from(gameWeeks)
    .where(eq(gameWeeks.gameId, query.gameId))
    .limit(10)
    .orderBy(desc(gameWeeks.startDateTime))
    .as("gameWeeksSubQuery");


  const result = await db.select()
    .from(games)
    .leftJoin(gamesToUsers, eq(gamesToUsers.gameId, games.id))
    .leftJoin(users, eq(gamesToUsers.userId, users.id))
    .leftJoin(admin, eq(games.adminId, admin.id))
    .leftJoin(gameWeeksSubQuery, eq(gameWeeksSubQuery.gameId, games.id))
    .where(
      eq(games.id, query.gameId),
    );

  logger.info("fetchOne: query result", {
    result: result || "none",
    gameId: query.gameId,
  });
  if (!result) {
    return {
      statusCode: 404,
    };
  }
  const gamesFromResults = resultsToGames(result);

  logger.info("fetchOne: transform complete", {
    gamesFromResults,
  });

  if (gamesFromResults.length === 0) {
    logger.warning("fetchOne: no games found from result", {
      result,
    });
    return {
      statusCode: 404,
    };
  }

  if (gamesFromResults.length > 1) {
    logger.warning("fetchOne: multiple games found from result", {
      result,
    });
    return {
      statusCode: 500,
    };
  }

  return {
    response: gamesFromResults[0] as Game,
  };
}, {
  querySchema: z.object({
    gameId: z.string(),
  }),
  responseSchema: gameWithRelationsSchema,
});

function resultsToGames(results: {
    users: SelectUser | null
    games: SelectGame | null
    games_to_users: { userId: string, gameId: string } | null,
    admin: SelectUser | null
    gameWeeksSubQuery: SelectGameWeek | null
}[]):Game[] {
  const logger = getLogger();
  logger.info("resultsToGames: begin", {
    results: results || "none",
  });
  const gamesMap = new Map<string, Game>();
  const usersMap = new Map<string, User & {gameId: string}>();
  const gameWeeksMap = new Map<string, GameWeek>();
  let admin: User | null = null;

  for (const result of results) {
    logger.info("resultsToGames: processing result", {
      result,
    });
    if (result.games && result.admin) {
      admin = userSchema.parse({
        sqlId: result.admin.id,
        ...result.admin,
      });
      const existingGame = gamesMap.get(result.games.id);
      if (!existingGame) {
        const gameData = {
          ...result.games,
          adminSqlId: result.admin.id,
          sqlId: result.games.id,
          period: result.games.period,
        };
        const parsedGameResult = gameSchema.safeParse(gameData);
        if (!parsedGameResult.success) {
          logger.error("resultsToGames: failed to parse game", {
            gameData,
            err: parsedGameResult.error,
          });
          continue;
        }
        gamesMap.set(result.games.id, parsedGameResult.data);
      }
      if (result.users) {
        const existingUser = usersMap.get(result.users.id);
        if (!existingUser) {
          const userData = {
            email: result.users.email,
            firestoreId: result.users.id,
            sqlId: result.users.id,
            username: result.users.username || null,
            aboutMe: result.users.aboutMe || null,
            avatarUrl: result.users.avatarUrl || null,
            createdAt: result.users.createdAt,
            updatedAt: result.users.updatedAt || null,
          };
          const parsedUserResult = userSchema.safeParse(userData);
          if (!parsedUserResult.success) {
            logger.error("resultsToGames: failed to parse user", {
              userData,
              err: parsedUserResult.error,
            });
            continue;
          }
          usersMap.set(result.users.id, {
            gameId: result.games.id,
            ...parsedUserResult.data,
          });
        }
      }
      if (result.gameWeeksSubQuery) {
        const existingGameWeek = gameWeeksMap.get(result.gameWeeksSubQuery.id);
        if (!existingGameWeek) {
          const parsedGameWeekResult = gameWeekSchema.safeParse({
            ...result.gameWeeksSubQuery,
            sqlId: result.gameWeeksSubQuery.id,
            gameSqlId: result.games.id,
          });
          if (!parsedGameWeekResult.success) {
            logger.error("resultsToGames: failed to parse game week", {
              gameWeekData: result.gameWeeksSubQuery,
              err: parsedGameWeekResult.error,
            });
            continue;
          }
          gameWeeksMap.set(result.gameWeeksSubQuery.id, parsedGameWeekResult.data);
        }
      }
    }
  }
  const games = Array.from(gamesMap.values());
  const users = Array.from(usersMap.values());
  const gameWeeks = Array.from(gameWeeksMap.values());
  return games.map((game) => {
    const players = users.filter((user) => user.gameId === game.sqlId);
    const gameWeeksForGame = gameWeeks.filter((gameWeek) => gameWeek.gameSqlId === game.sqlId);
    return gameWithRelationsSchema.parse({
      ...game,
      players,
      gameWeeks: gameWeeksForGame,
      admin,
    });
  });
}
