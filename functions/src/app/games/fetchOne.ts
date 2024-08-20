import {and, eq} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";


import {Game, gameSchema} from "./schemas";

export const fetchOne = httpHandler(async ({query}) => {
  const logger = getLogger();
  const db = getDb();
  logger.info("fetchOne: begin", {
    query: query || "none",
  });
  const admin = alias(users, "admin");
  const result = await db.select()
    .from(gamesToUsers)
    .leftJoin(users, eq(gamesToUsers.userId, users.id))
    .leftJoin(games, eq(gamesToUsers.gameId, games.id))
    .leftJoin(admin, eq(games.adminId, admin.id))
    .where(
      and(
        eq(games.id, query.gameId),
      )
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
  responseSchema: gameSchema,
});

function resultsToGames(results: {
    users: SelectUser | null
    games: SelectGame | null
    games_to_users: { userId: string, gameId: string },
    admin: SelectUser | null
}[]):Game[] {
  const gamesMap = new Map<string, Game>();
  for (const result of results) {
    if (!result.games || !result.admin) {
      continue;
    }
    const game = gamesMap.get(result.games.id) || gameSchema.parse({
      ...result.games,
      admin: {
        sqlId: result.admin.id,
        ...result.admin,
      },
      players: [],
    });
    if (result.users) {
      game.players.push({
        email: result.users.email,
        firestoreId: result.users.id,
        sqlId: result.games_to_users.userId,
        username: result.users.username || null,
      });
    }
    gamesMap.set(result.games.id, game);
  }
  return Array.from(gamesMap.values());
}
