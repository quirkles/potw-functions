import {onRequest} from "firebase-functions/v2/https";

import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";

import {responseSchema} from "./schemas";


export const testResponse = onRequest(
  httpHandler(
    (payload) => {
      const logger = getLogger();
      const {body} = payload;
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
      responseSchema: responseSchema,
    }
  )
);
