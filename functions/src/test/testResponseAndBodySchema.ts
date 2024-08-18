import {onRequest} from "firebase-functions/v2/https";

import {payloadSchema, responseSchema} from "./schemas";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {getLogger} from "../functionWrapper";


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
