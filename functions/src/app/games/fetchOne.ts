import {eq} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {GameWeek, gameWeekSchema} from "../gameWeeks/schemas";

import {Game, gameSchema, gamePlayerSchema, GamePlayer} from "./schemas";
import {periodStringToPeriod} from "./transforms";

export const fetchOne = httpHandler(async ({query}) => {
  const logger = getLogger();
  const db = getDb();
  logger.info("fetchOne: begin", {
    query: query || "none",
  });
  const admin = alias(users, "admin");
  const result = await db.select()
    .from(games)
    .leftJoin(gamesToUsers, eq(gamesToUsers.gameId, games.id))
    .leftJoin(users, eq(gamesToUsers.userId, users.id))
    .leftJoin(admin, eq(games.adminId, admin.id))
    .leftJoin(gameWeeks, eq(gameWeeks.gameId, games.id))
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
  responseSchema: gameSchema,
});

function resultsToGames(results: {
    users: SelectUser | null
    games: SelectGame | null
    games_to_users: { userId: string, gameId: string } | null,
    admin: SelectUser | null
    game_weeks: SelectGameWeek | null
}[]):Game[] {
  const gamesMap = new Map<string, Game>();
  const usersMap = new Map<string, GamePlayer & {gameId: string}>();
  const gameWeeksMap = new Map<string, GameWeek & {gameId: string}>();

  for (const result of results) {
    if (result.games && result.admin) {
      const existingGame = gamesMap.get(result.games.id);
      if (!existingGame) {
        gamesMap.set(result.games.id, gameSchema.parse({
          ...result.games,
          period: periodStringToPeriod(result.games.period),
          gameWeeks: [],
          admin: {
            sqlId: result.admin.id,
            ...result.admin,
          },
          players: [],
        }));
      }
      if (result.users) {
        const existingUser = usersMap.get(result.users.id);
        if (!existingUser) {
          usersMap.set(result.users.id, {
            gameId: result.games.id,
            ...gamePlayerSchema.parse({
              email: result.users.email,
              firestoreId: result.users.id,
              sqlId: result.users.id,
              username: result.users.username || null,
            }),
          });
        }
      }
      if (result.game_weeks) {
        const existingGameWeek = gameWeeksMap.get(result.game_weeks.id);
        if (!existingGameWeek) {
          gameWeeksMap.set(result.game_weeks.id, {
            gameId: result.games.id,
            ...gameWeekSchema.parse({
              sqlId: result.game_weeks.id,
              startDateTime: result.game_weeks.startDateTime,
              theme: result.game_weeks.theme || null,
              meetingLink: result.game_weeks.meetingLink || null,
            }),
          });
        }
      }
    }
  }
  const games = Array.from(gamesMap.values());
  const users = Array.from(usersMap.values());
  const gameWeeks = Array.from(gameWeeksMap.values());
  return games.map((game) => {
    const players = users.filter((user) => user.gameId === game.id);
    const gameWeeksForGame = gameWeeks.filter((gameWeek) => gameWeek.gameId === game.id);
    return {
      ...game,
      players,
      gameWeeks: gameWeeksForGame,
    };
  });
}
