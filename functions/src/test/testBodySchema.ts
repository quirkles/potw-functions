import {onRequest} from "firebase-functions/v2/https";

import {payloadSchema} from "./schemas";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {getLogger} from "../functionWrapper";


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
