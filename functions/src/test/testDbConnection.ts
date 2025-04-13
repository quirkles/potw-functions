import {getDb} from "../db/dbClient";
import {games} from "../db/schema/game";
import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";

export const pingDb = httpHandler(async () => {
  const logger = getLogger();
  logger.info("pingDb: begin");
  const db = getDb();
  const result = await db.select().from(games).limit(10);
  logger.info("pingDb: result", {
    result,
  });
  return {
    statusCode: 200,
    response: {
      result,
    },
  };
}, {
  functionName: "pingDb",
});
