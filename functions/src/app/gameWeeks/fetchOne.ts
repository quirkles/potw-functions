import {
  sqlGameWeekWithRelationsSchema,
  TSqlGame,
  TSqlGameWeek,
  TSqlGameWeekWithRelations,
  TSqlPick,
} from "@potw/schemas";
import {eq} from "drizzle-orm";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {picks, SelectPick} from "../../db/schema/picks";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {NotFoundError} from "../../utils/Errors";
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
  responseSchema: sqlGameWeekWithRelationsSchema,
  vpcConnector: "psql-connector",
  vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
});

function processResults(results: {
  games: SelectGame | null,
  game_weeks: SelectGameWeek | null,
  picks: SelectPick | null
}[]): TSqlGameWeekWithRelations {
  let gameWeek: Partial<TSqlGameWeek> = {};
  let game: Partial<TSqlGame> = {};
  const picks: Partial<TSqlPick>[] = [];

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

  return sqlGameWeekWithRelationsSchema.parse({
    ...gameWeek,
    game,
    picks,
  });
}
