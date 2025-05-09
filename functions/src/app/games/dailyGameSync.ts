import {addDays, addHours} from "date-fns";
import {and, asc, eq} from "drizzle-orm";
import {inArray} from "drizzle-orm/sql/expressions/conditions";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {pubsubHandler} from "../../functionWrapper/pubsubfunctionWrapper";
import {onScheduleHandler} from "../../functionWrapper/schedulefunctionWrapper";
import {getFirestore} from "../../services/firestore/firestore";
import {initializeGameWeeksForGame} from "../../services/games/initializeNextGameWeeks";
import {dispatchPubSubEvent, payloadCreators, TopicNames} from "../../services/pubsub";
import {calculateNextGameWeekStartDate} from "../../utils/dates";

const BATCH_SIZE = 20;

const initiateDailyGameUpdateHandler = async function(): Promise<void> {
  const logger = getLogger();
  logger.info("initiateDailyGameUpdate: begin");
  let isStreamingGames = true;
  const gamesToProcess: {
        gameSqlId: string;
        gameFirestoreId: string;
    }[] = [];
  const gamesStream = getFirestore()
    .collection("games")
    .where("status", "!=", "inactive")
    .stream();
  gamesStream.on("data", (doc) => {
    const gameData = doc.data();
    logger.info("Game data", {game: gameData || "none"});
    const {
      sqlId,
      startDate,
      status,
    } = gameData;
    if (!sqlId || !startDate) {
      logger.warning("Invalid game data, missing sql id or start date", {gameData});
      return;
    }
    if (
      status === "active" ||
            (status === "pending" && addDays(new Date(), 1) >= new Date(startDate))
    ) {
      logger.info("Dispatching daily game update", {gameData});
      gamesToProcess.push({
        gameSqlId: sqlId,
        gameFirestoreId: String(doc.id),
      });
    } else {
      logger.info("Game is not active or due to start in one day. Ignoring", {gameData});
    }
  });
  gamesStream.on("error", (err) => {
    logger.error("Error streaming games", {err});
  });
  gamesStream.on("end", () => {
    isStreamingGames = false;
    logger.info("End of game stream");
  });
  while (isStreamingGames || gamesToProcess.length > 0) {
    if (gamesToProcess.length >= BATCH_SIZE || (!isStreamingGames && gamesToProcess.length > 0)) {
      const batch = gamesToProcess.splice(0, BATCH_SIZE);
      await dispatchPubSubEvent(payloadCreators.DAILY_GAME_UPDATE({
        games: batch,
      }));
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};
export const initiateDailyGameUpdate = onScheduleHandler(initiateDailyGameUpdateHandler, {
  functionName: "initiateDailyGameUpdate",
  schedule: "00 00 * * *",
  timeZone: "America/New_York",
});

export const initiateDailyGameUpdateHttp = httpHandler(initiateDailyGameUpdateHandler, {
  functionName: "initiateDailyGameUpdate",
});

export const doDailyGameUpdate = pubsubHandler(
  async function(body): Promise<void> {
    const db = getDb();
    const logger = getLogger();
    logger.info("dailyGameUpdate: begin", {body});
    let processingCount = 0;
    while (body.games.length) {
      logger.info("dailyGameUpdate: processing", {
        processingCount,
        remaining: body.games.length,
      });
      const toProcess = body.games.shift();
      if (processingCount >= BATCH_SIZE || !toProcess) {
        logger.debug("dailyGameUpdate: waiting tick", {
          processingCount,
          remaining: body.games.length,
          toProcess: toProcess || "none",
        });
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }

      processingCount++;

      const {gameSqlId, gameFirestoreId} = toProcess;

      logger.info("dailyGameUpdate: begin", {
        processing: {
          gameSqlId,
          gameFirestoreId,
        },
      });


      const [game] = await db.select().from(games).where(eq(games.id, gameSqlId)).execute();

      logger.info("Game found", {game: game || "none"});

      if (!game) {
        throw new Error("Game not found");
      }


      if (game.status === "inactive") {
        logger.info("Game is inactive, nothing to do", {game});
        return;
      }

      const gameRef = getFirestore().collection("games").doc(gameFirestoreId);


      logger.info("Game ref", {gameRef});

      if (game.status === "pending") {
        logger.info("Game is pending", {game});
        if (addDays(new Date(), 1) >= new Date(game.startDate)) {
          logger.info("Game is pending and start date is today or tomorrow, updating status to active", {game});
          await db.update(games).set({status: "active"}).where(eq(games.id, gameSqlId)).execute();
          await gameRef.update({status: "active"});
        } else {
          logger.info("Game is pending, start date is not today or tomorrow, nothing needs to be done", {game});
          return;
        }
      }

      if (
        game.endDate &&
          game.status === "active" &&
          addDays(new Date(), 1) >= new Date(game.endDate)
      ) {
        logger.info("Game is active and end date is today or tomorrow, updating status to inactive", {game});
        await db.update(games).set({status: "inactive"}).where(eq(games.id, gameSqlId)).execute();
        await gameRef.update({status: "inactive"});
        return;
      }


      logger.info("Game is active, updating game weeks", {game});
      const result = await initializeGameWeeksForGame(gameSqlId, 2);
      logger.info("Game weeks updated", {result});
      const gameWeekResults = await db.select().from(gameWeeks)
        .where(
          and(
            eq(gameWeeks.gameId, gameSqlId),
            inArray(gameWeeks.status, ["pending", "current", "overdue"]),
          )
        )
        .leftJoin(games, eq(gameWeeks.gameId, games.id))
        .orderBy(asc(gameWeeks.startDateTime), asc(gameWeeks.id))
        .limit(50)
        .execute();

      await processResults(gameWeekResults);
      processingCount--;
    }
    return;
  }, {
    bodySchema: z.object({
      games: z.array(z.object({
        gameSqlId: z.string(),
        gameFirestoreId: z.string(),
      })),
    }),
    functionName: "doDailyGameUpdate",
    topic: TopicNames.DAILY_GAME_UPDATE,
    maxInstances: 15,
    retry: false,
  } as const);

async function processResults(results: {
    game_weeks: SelectGameWeek;
    games: SelectGame | null;
}[]): Promise<void> {
  const logger = getLogger();
  logger.info("Processing game weeks", {results});
  let cursor: SelectGameWeek | null = null;
  const actions: {
        gameWeekId: string;
        adminId: string;
        action: "setOverdue" | "closeGameWeek" | "startGameWeek";
    }[] = [];
  for (const result of results) {
    const {game_weeks: gameWeek, games: game} = result;
    if (cursor === null) {
      cursor = gameWeek;
    } else if (
      gameWeek.startDateTime >= cursor.startDateTime &&
            gameWeek.id > cursor.id
    ) {
      cursor = gameWeek;
    }
    if (game === null) {
      continue;
    }
    let action: "setOverdue" | "closeGameWeek" | "startGameWeek" | null = null;
    // If the game week is pending and the start date is 5 hours ago or more, send a reminder
    if (gameWeek.status === "current" && addHours(gameWeek.startDateTime, 5) <= new Date()) {
      action = "setOverdue";
      // If the game week is pending and the start date is 3 days ago or more, close the game week
    } else if (gameWeek.status === "overdue" && addDays(gameWeek.startDateTime, 3) <= new Date()) {
      action = "closeGameWeek";
    } else if (
      gameWeek.status === "pending" &&
            gameWeek.startDateTime <= calculateNextGameWeekStartDate(game, null)
    ) {
      action = "startGameWeek";
    }
    if (action !== null) {
      actions.push({
        gameWeekId: gameWeek.id,
        adminId: game.adminId,
        action,
      });
    }
    if (cursor === null) {
      throw new Error("No cursor found");
    }
    logger.info("Processing actions", {actions});

    const pubSubPromises: Promise<unknown>[] = [];

    const db = getDb();

    const txResults = await db.transaction(async (trx) => {
      const txReturns: Record<string, unknown>[] = [];
      for (const action of actions) {
        if (action.action === "setOverdue") {
          logger.info("Sending reminder", {gameWeekId: action.gameWeekId});
          trx.update(gameWeeks)
            .set({status: "overdue"})
            .where(eq(gameWeeks.id, action.gameWeekId))
            .returning({
              gameWeekId: gameWeeks.id,
              status: gameWeeks.status,
            }).then((res) => {
              txReturns.push({...res, expectedStatus: "overdue"});
            });
          pubSubPromises.push(dispatchPubSubEvent(payloadCreators.SEND_CLOSE_GAME_WEEK_REMINDER({
            gameWeekId: action.gameWeekId,
            adminId: action.adminId,
          })).catch((err) => {
            logger.error("Error sending reminder", {
              err, payloadCreators: {
                gameWeekId: action.gameWeekId,
                adminId: action.adminId,
              },
            });
          }));
        } else if (action.action === "closeGameWeek") {
          logger.info("Closing game week", {gameWeekId: action.gameWeekId});
          trx.update(gameWeeks)
            .set({status: "complete"})
            .where(eq(gameWeeks.id, action.gameWeekId)).returning({
              gameWeekId: gameWeeks.id,
              status: gameWeeks.status,
            }).then((res) => {
              txReturns.push({...res, expectedStatus: "complete"});
            });
        } else if (action.action === "startGameWeek") {
          logger.info("Starting game week", {gameWeekId: action.gameWeekId});
          trx.update(gameWeeks)
            .set({status: "current"})
            .where(eq(gameWeeks.id, action.gameWeekId)).returning({
              gameWeekId: gameWeeks.id,
              status: gameWeeks.status,
            }).then((res) => {
              txReturns.push({...res, expectedStatus: "current"});
            });
        }
      }
      return txReturns;
    });

    logger.info("Transaction results", {txResults});

    await Promise.all(pubSubPromises);
  }
}
