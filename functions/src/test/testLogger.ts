import {onRequest} from "firebase-functions/v2/https";

import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";

import {getUser} from "./testService/userService";

export const testLogger = onRequest(
  httpHandler(
    async ({body}) => {
      const logger = getLogger();
      logger.debug("Test debug message", {
        messageLevel: "debug",
      });
      logger.info("Test info message", {
        messageLevel: "info",
      });
      logger.notice("Test notice message", {
        messageLevel: "notice",
      });
      logger.warning("Test warning message", {
        messageLevel: "warn",
      });
      logger.error("Test error message", {
        messageLevel: "error",
      });
      logger.critical("Test critical message", {
        messageLevel: "critical",
      });
      logger.alert("Test alert message", {
        messageLevel: "alert",
      });
      logger.emergency("Test emergency message", {
        messageLevel: "emergency",
      });
      logger.debug("Body:", body);
      const user = await getUser();
      logger.debug("User:", user);
      return {
        response: {
          message: "Test function completed successfully",
        },
      };
    }
  )
);
