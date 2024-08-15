import {onRequest} from "firebase-functions/v2/https";

import {responseSchema} from "./schemas";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {getLogger} from "../functionWrapper";


export const testBody = onRequest(
  httpHandler(
    (payload) => {
      const logger = getLogger();
      const {
        username,
        password,
        // age, // Uncomment this line to see the type error
      } = payload;
      logger.info("Body here", {
        username,
        password,
      });
    }, {
      responseSchema,
    }
  )
);
