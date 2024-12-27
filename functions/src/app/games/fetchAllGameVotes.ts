import {sqlVoteSchema, TSqlVote} from "@potw/schemas";
import {eq} from "drizzle-orm";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {picks, SelectPick} from "../../db/schema/picks";
import {SelectUser, users} from "../../db/schema/user";
import {SelectVote, votes} from "../../db/schema/votes";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";

export const fetchAllGameVotes = httpHandler(async ({query}) => {
  const logger = getLogger();
  const db = getDb();
  logger.info("fetchAllGameVotes: begin");
  const result = await db.select().from(games)
    .leftJoin(gameWeeks, eq(gameWeeks.gameId, games.id))
    .leftJoin(picks, eq(picks.gameWeekId, gameWeeks.id))
    .leftJoin(votes, eq(votes.pickId, picks.id))
    .leftJoin(users, eq(users.id, votes.userId))
    .where(
      eq(games.id, query.gameId),
    );

  logger.info("fetchAllGameVotes: query result", {
    result: result || "none",
  });

  const response = processResults(result);
  return {
    response,
  };
}, {
  querySchema: z.object({
    gameId: z.string(),
  }),
});

function processResults(results: {
    games: SelectGame,
    game_weeks: SelectGameWeek | null,
    picks: SelectPick | null,
    votes: SelectVote | null
    users: SelectUser | null
}[]): TSqlVote[] {
  const logger = getLogger();
  return results.filter((result) => result.votes !== null).map((result) => {
    logger.info("processResults: result", {
      result: result || "none",
    });
    return {
      sqlId: result.votes?.id as string,
      firestoreId: result.votes?.firestoreId as string,
      gameSqlId: result.games?.id as string,
      gameFirestoreId: result.games?.firestoreId as string,
      gameWeekSqlId: result.game_weeks?.id as string,
      gameWeekFirestoreId: result.game_weeks?.firestoreId as string,
      pickSqlId: result.picks?.id as string,
      pickFirestoreId: result.picks?.firestoreId as string,
      userSqlId: result.users?.id as string,
      userFirestoreId: result.users?.firestoreId as string,
    };
  }).filter((gameVote) => {
    if (sqlVoteSchema.safeParse(gameVote).success) {
      return true;
    }
    logger.error("Invalid gameVote", {gameVote});
    return false;
  });
}
