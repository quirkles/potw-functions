import {onRequest} from "firebase-functions/v2/https";

import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";

import {payloadSchema} from "./schemas";


export const testBody = onRequest(
  httpHandler(
    ({body}) => {
      const logger = getLogger();
      const {
        username,
        password,
        // age, // Uncomment this line to see the type error
      } = body;
      logger.info("Body here", {
        username,
        password,
      });
    }, {
      bodySchema: payloadSchema,
    }
  )
);
