import {onRequest} from "firebase-functions/v2/https";

import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";

import {payloadSchema, responseSchema} from "./schemas";


export const testResponseAndBody = onRequest(
  httpHandler(
    ({body}) => {
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
        response: {

          // Comment the next line to see the type error
          message: "Test function completed successfully",
        },
      };
    }, {
      bodySchema: payloadSchema,
      responseSchema,
    }
  )
);
