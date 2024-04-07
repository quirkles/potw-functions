import {onRequest} from "firebase-functions/v2/https";

import {httpHandler, getLogger} from "../functionWrapper/functionWrapper";
import {bodySchema} from "./schemas";


export const testBody = onRequest(
  httpHandler(
    (payload) => {
      const {
        body,
        headers,
      } = payload;
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
      logger.info("headers here", {
        test: headers["x-test-header"],
        //   uncomment next line to see the type error
        // shouldError: headers["not-in-use-headers"],
      });
    }, {
      bodySchema,
      useHeaders: ["x-test-header"] as const,
    }
  )
);
