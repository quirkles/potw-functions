import {z} from "zod";

import {getLogger} from "../../functionWrapper";
import {
  documentUpdateListenerHandler,
} from "../../functionWrapper/documentUpdateListenerWrapper";
import {firebaseGameWeekSchema} from "../../validation/firebaseGameWeek";

export const onGameWeekUpdate = documentUpdateListenerHandler(
  async (
    before,
    after,
    params) => {
    const logger = getLogger();
    const beforeThemePollStatus = before?.themePoll?.status;
    const afterThemePollStatus = after?.themePoll?.status;
    const beforeTheme = before?.theme;
    const afterTheme = after?.theme;

    if (
      (beforeThemePollStatus === "open" && afterThemePollStatus === "closed" && afterTheme) ||
            (!beforeTheme && afterTheme && afterThemePollStatus === "closed")
    ) {
      logger.info("onGameJoinRequest: theme poll is closed. Updating", {
        beforeThemePollStatus,
        afterThemePollStatus,
        afterTheme,
        params,
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
    vpcConnector: "psql-connector",
    vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
  }
);
