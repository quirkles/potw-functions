import {eq} from "drizzle-orm";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {picks, SelectPick} from "../../db/schema/picks";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {NotFoundError} from "../../utils/Errors";
import {GameWeek} from "../../validation/gameWeek";
import {Pick} from "../../validation/pick";
import {SqlGame} from "../../validation/sqlGame";
import {
  GameWeekWithRelations,
  gameWeekWithRelationsSchema,
} from "../../validation/withRelations";
import {selectGameToGame} from "../transforms/selectGameToGame";
import {selectGameWeekToGameWeek} from "../transforms/selectGameWeekToGameWeek";
import {selectPickToPick} from "../transforms/selectPickToPick";


export const fetchOne = httpHandler(async ({query}) => {
  const logger = getLogger();
  const db = getDb();
  logger.info("fetchOne: begin", {
    query: query || "none",
  });
  const result = await db.select()
    .from(gameWeeks)
    .leftJoin(games, eq(gameWeeks.gameId, games.id))
    .leftJoin(picks, eq(picks.gameWeekId, gameWeeks.id))
    .where(
      eq(gameWeeks.id, query.gameWeekId),
    );

  logger.info("fetchOne: query result", {
    result: result || "none",
  });

  if (!result) {
    throw new NotFoundError("Game week not found");
  }

  return {
    response: processResults(result),
  };
}, {
  querySchema: z.object({
    gameWeekId: z.string(),
  }),
  responseSchema: gameWeekWithRelationsSchema,
  vpcConnector: "psql-connector",
  vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
});

function processResults(results: {
  games: SelectGame | null,
  game_weeks: SelectGameWeek | null,
  picks: SelectPick | null
}[]): GameWeekWithRelations {
  let gameWeek: Partial<GameWeek> = {};
  let game: Partial<SqlGame> = {};
  const picks: Partial<Pick>[] = [];

  for (const result of results) {
    if (result.game_weeks) {
      gameWeek = {
        ...gameWeek,
        ...selectGameWeekToGameWeek(result.game_weeks),
      };
    }
    if (result.games) {
      game = {
        ...game,
        ...selectGameToGame(result.games),
      };
    }
    if (result.picks) {
      picks.push(selectPickToPick(result.picks));
    }
  }

  return gameWeekWithRelationsSchema.parse({
    ...gameWeek,
    game,
    picks,
  });
}
