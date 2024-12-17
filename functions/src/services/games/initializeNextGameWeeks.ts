import {eq} from "drizzle-orm";
import {gte} from "drizzle-orm/sql/expressions/conditions";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {getLogger} from "../../functionWrapper";
import {NotFoundError} from "../../utils/Errors";
import {calculateNextGameWeekStartDate} from "../../utils/dates";
import {SqlGameWeek} from "../../validation/sqlGameWeek";
import {getFirestore} from "../firestore/firestore";

export async function initializeGameWeeksForGame(gameId: string, weeksToCreate: number): Promise<SqlGameWeek[]> {
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
        period: queryResult.period,
        regularScheduledStartTimeUtc: queryResult.regularScheduledStartTimeUtc,
      },
      startDate
    );

    const gameWeekRef = getFirestore().collection("gameWeeks").doc();

    toCreate.push({
      gameId,
      status: "pending",
      firestoreId: gameWeekRef.id,
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
    firestoreId: gameWeeks.firestoreId,
    gameId: gameWeeks.gameId,
    startDateTime: gameWeeks.startDateTime,
  }).execute();


  logger.info("initializeGameWeeksForGame: game weeks created", {
    results,
  });

  await getFirestore().runTransaction(async (tx) => {
    for (const result of results) {
      const gameWeekRef = getFirestore().collection("gameWeeks").doc(result.firestoreId);
      tx.set(gameWeekRef, {
        sqlId: result.insertedId,
        gameSqlId: gameId,
        gameFirestoreId: queryResult.firestoreId,
      });
    }
  });

  return results.map((result) => ({
    sqlId: result.insertedId,
    firestoreId: result.firestoreId,
    startDateTime: result.startDateTime,
    status: "pending",
    theme: null,
    meetingLink: null,
    gameSqlId: gameId,
  }));
}
