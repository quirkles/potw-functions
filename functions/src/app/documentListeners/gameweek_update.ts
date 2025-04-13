import {firebaseGameWeekSchema} from "@potw/schemas";
import {eq} from "drizzle-orm";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {gameWeeks} from "../../db/schema/gameWeek";
import {getLogger} from "../../functionWrapper";
import {
  documentUpdateListenerHandler,
} from "../../functionWrapper/documentUpdateListenerWrapper";

export const onGameWeekUpdate = documentUpdateListenerHandler(
  async function gameWeekUpdateHandler(
    before,
    after,
    params) {
    const logger = getLogger();
    const beforeThemePollStatus = before?.themePoll?.status;
    const afterThemePollStatus = after?.themePoll?.status;
    const beforeTheme = before?.theme;
    const afterTheme = after?.theme;

    if (
      (beforeThemePollStatus === "open" && afterThemePollStatus === "closed" && afterTheme) ||
            ((beforeTheme !== afterTheme) && afterThemePollStatus === "closed")
    ) {
      logger.info("onGameJoinRequest: theme poll is closed. Updating", {
        beforeThemePollStatus,
        afterThemePollStatus,
        afterTheme,
        params,
      });
      const {gameWeekId: firestoreGameWeekId} = params;

      const db = getDb();

      const update = await db.update(gameWeeks).set({
        theme: afterTheme,
      }).where(eq(gameWeeks.firestoreId, firestoreGameWeekId)).returning({
        id: gameWeeks.id,
      });

      if (!update || !update.length) {
        logger.warning("Update failed, no results");
        throw new Error("Update failed");
      }

      if (update.length !== 1) {
        logger.warning("Unexpected multiple update results", {
          updateResults: update,
        });
        throw new Error("Unexpected multiple update results");
      }


      logger.info("Updated game week", {
        sqlId: update[0].id,
        firestoreId: firestoreGameWeekId,
      });
      return;
    }
    logger.info("No action taken");
  }, {
    document: "gameWeeks/{gameWeekId}",
    beforeDocumentSchema: firebaseGameWeekSchema,
    afterDocumentSchema: firebaseGameWeekSchema,
    paramsSchema: z.object({
      gameWeekId: z.string(),
    }),
    functionName: "onGameJoinRequest",
  }
);
