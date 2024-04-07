import {onRequest} from "firebase-functions/v2/https";

import {httpHandler, getLogger} from "../functionWrapper/functionWrapper";
import {bodySchema} from "./schemas";


export const testBody = onRequest(
  httpHandler(
    (body) => {
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
    }, {bodySchema}
  )
);
