import {eq} from "drizzle-orm";
import {gte} from "drizzle-orm/sql/expressions/conditions";

import {GameWeek} from "../../app/gameWeeks/schemas";
import {periodStringToPeriod} from "../../app/games/transforms";
import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {getLogger} from "../../functionWrapper";
import {NotFoundError} from "../../utils/Errors";
import {calculateNextGameWeekStartDate} from "../../utils/dates";

export async function initializeGameWeeksForGame(gameId: string, weeksToCreate: number): Promise<GameWeek[]> {
  const logger = getLogger();
  logger.info("initializeGameWeeksForGame: begin", {
    gameId,
    weeksToCreate,
  });
  const db = getDb();
  const queryResult = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      gameWeeks: {
        where: gte(gameWeeks.startDateTime, new Date()),
      },
    },
  });


  if (!queryResult) {
    throw new NotFoundError("Game not found");
  }

  logger.info("initializeGameWeeksForGame: game found", {
    query: queryResult,
  });

  let gameWeeksToCreate = weeksToCreate - queryResult.gameWeeks.length;

  if (gameWeeksToCreate <= 0) {
    logger.info("initializeGameWeeksForGame: no game weeks to create", {
      query: queryResult,
      weeksToCreate,
    });
    return [];
  }

  const toCreate: Omit<SelectGameWeek, "id">[] = [];

  const nextScheduledGameWeek = queryResult.gameWeeks[queryResult.gameWeeks.length - 1] || null;

  logger.info("initializeGameWeeksForGame: next scheduled game week", {
    nextScheduledGameWeek,
  });

  let startDate: Date | null = nextScheduledGameWeek?.startDateTime;

  while (gameWeeksToCreate > 0) {
    logger.info("initializeGameWeeksForGame: calculating next start date", {
      startDate,
      gameWeeksToCreate,
    });
    startDate = calculateNextGameWeekStartDate(
      {
        startDate: queryResult.startDate,
        period: periodStringToPeriod(queryResult.period),
        regularScheduledStartTimeUtc: queryResult.regularScheduledStartTimeUtc,
      },
      startDate
    );
    toCreate.push({
      gameId,
      startDateTime: startDate,
      theme: null,
      meetingLink: null,
    });
    gameWeeksToCreate--;
  }

  logger.info("initializeGameWeeksForGame: creating game weeks", {
    toCreate,
  });

  const results = await db.insert(gameWeeks).values(toCreate).returning({
    insertedId: gameWeeks.id,
    gameId: gameWeeks.gameId,
    startDateTime: gameWeeks.startDateTime,
  }).execute();

  logger.info("initializeGameWeeksForGame: game weeks created", {
    results,
  });

  return results.map((result) => ({
    sqlId: result.insertedId,
    gameId: result.gameId,
    startDateTime: result.startDateTime,
    theme: null,
    meetingLink: null,
  }));
}
