import {eq} from "drizzle-orm";
import {onRequest} from "firebase-functions/v2/https";
import {v4} from "uuid";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {createLogger} from "../../services/Logger/Logger.pino";

export const fetchUserById = onRequest(
  async (req, res) => {
    const logger =createLogger({
      name: "fetchUserById",
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        functionExecutionId: v4(),
        correlationId: req.headers["x-correlation-id"] as string || v4(),
      },
    });
    logger.info("fetchUserById: begin", {
      query: req.query,
    });
    const {
      id
      , includeGames = "",
    } = req.query;
    if (!id) {
      logger.warning("fetchUserById: id is required");
      res.status(400).send("id is required");
      return;
    }
    const shouldIncludeGames = includeGames === "true";
    const db = getDb();
    const result = await db.query.users.findFirst({
      where: eq(users.id, String(id)),
      with: {
        gamesAsParticipant: shouldIncludeGames as true,
        gamesAsAdmin: shouldIncludeGames as true,
      },
    });
    if (!result) {
      logger.warning("fetchUserById: user not found", {
        id,
      });
      res.status(404).send("user not found");
      return;
    }
    logger.info("fetchUserById: success", {
      result,
    });
    (result as Record<string, unknown>)["sqlId"] = result.id;
    res.status(200).json(result);
    return;
  });
