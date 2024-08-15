import {onRequest} from "firebase-functions/v2/https";

import {payloadSchema, responseSchema} from "./schemas";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {getLogger} from "../functionWrapper";


export const testResponseAndBody = onRequest(
  httpHandler(
    (payload) => {
      const logger = getLogger();
      const {
        username,
        password,
      } = payload;
      logger.info("Body here", {
        username,
        password,
      });
      return {
        // Comment the next line to see the type error
        message: "Test function completed successfully",
      };
    }, {
      payloadSchema,
      responseSchema,
    }
  )
);
