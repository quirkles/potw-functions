import {addDays, addHours} from "date-fns";
import {and, asc, eq} from "drizzle-orm";
import {inArray} from "drizzle-orm/sql/expressions/conditions";
import {getFirestore} from "firebase-admin/firestore";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {gameWeeks, SelectGameWeek} from "../../db/schema/gameWeek";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {pubsubHandler} from "../../functionWrapper/pubsubfunctionWrapper";
import {onScheduleHandler} from "../../functionWrapper/schedulefunctionWrapper";
import {initializeGameWeeksForGame} from "../../services/games/intializeNextGameWeeks";
import {dispatchPubSubEvent, payloadCreators, TopicNames} from "../../services/pubsub";
import {calculateNextGameWeekStartDate} from "../../utils/dates";


const initiateDailyGameUpdateHandler = async function(): Promise<void> {
  const logger = getLogger();
  logger.info("initiateDailyGameUpdate: begin");
  let isStreamingGames = true;
  const gamesStream = getFirestore()
    .collection("games")
    .where("status", "!=", "inactive")
    .stream();
  gamesStream.on("data", async (doc) => {
    const gameData = doc.data();
    logger.info("Game update", {game: gameData || "none"});
    const {
      sqlId,
      startDate,
      status,
    } = gameData;
    if (!sqlId || !startDate) {
      logger.warning("Invalid game data", {gameData});
      return;
    }
    if (status === "active" || status === "pending" && addDays(new Date(), 1) >= new Date(startDate)) {
      logger.info("Dispatching daily game update", {gameData});
      await dispatchPubSubEvent(payloadCreators.DAILY_GAME_UPDATE({
        gameSqlId: sqlId,
        gameFirestoreId: String(doc.id),
      }));
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
  while (isStreamingGames) {
    await new Promise((resolve) => setTimeout(resolve, 500));
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
    const {gameSqlId, gameFirestoreId} = body;
    const logger = getLogger();
    logger.info("dailyGameUpdate: begin", {
      gameSqlId,
    });

    const db = getDb();

    const [game] = await db.select().from(games).where(eq(games.id, gameSqlId)).execute();

    if (!game) {
      throw new Error("Game not found");
    }

    const gameRef = getFirestore().collection("games").doc(gameFirestoreId);


    if (game.status === "inactive") {
      logger.info("Game is inactive, nothing to do", {game});
      return;
    }

    if (game.status === "pending") {
      if (addDays(new Date(), 1) >= new Date(game.startDate)) {
        logger.info("Game is pending and start date is today or tomorrow, updating status to active", {game});
        await db.update(games).set({status: "active"}).where(eq(games.id, gameSqlId)).execute();
        await gameRef.update({status: "active"});
      } else {
        logger.info("Game is pending, nothing to do", {game});
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

    return;
  }, {
    bodySchema: z.object({
      gameSqlId: z.string(),
      gameFirestoreId: z.string(),
    }),
    topic: TopicNames.SEND_EMAIL,
  });

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

    await db.transaction(async (trx) => {
      for (const action of actions) {
        if (action.action === "setOverdue") {
          logger.info("Sending reminder", {gameWeekId: action.gameWeekId});
          trx.update(gameWeeks)
            .set({status: "overdue"})
            .where(eq(gameWeeks.id, action.gameWeekId));
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
            .where(eq(gameWeeks.id, action.gameWeekId));
        } else if (action.action === "startGameWeek") {
          logger.info("Starting game week", {gameWeekId: action.gameWeekId});
          trx.update(gameWeeks)
            .set({status: "current"})
            .where(eq(gameWeeks.id, action.gameWeekId));
        }
      }
    });

    await Promise.all(pubSubPromises);
  }
}