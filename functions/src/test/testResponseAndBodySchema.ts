import {onRequest} from "firebase-functions/v2/https";

import {httpHandler, getLogger} from "../functionWrapper/functionWrapper";
import {bodySchema, responseSchema} from "./schemas";


export const testResponseAndBody = onRequest(
  httpHandler(
    (body) => {
      const logger = getLogger();
      const {
        username,
        password,
      } = body;
      logger.info("Body here", {
        username,
        password,
      });
      return {
        // Comment the next line to see the type error
        message: "Test function completed successfully",
      };
    }, {
      bodySchema,
      responseSchema,
    }
  )
);
