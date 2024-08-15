import {onRequest} from "firebase-functions/v2/https";

import {responseSchema} from "./schemas";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {getLogger} from "../functionWrapper";


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
        // Comment the next line to see the type error
        message: "Test function completed successfully",
      };
    }, {responseSchema}
  )
);
