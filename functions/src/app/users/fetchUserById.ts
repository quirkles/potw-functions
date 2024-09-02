import {eq} from "drizzle-orm";
import {v4} from "uuid";
import {z} from "zod";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {User, users, userSchema} from "../../db/schema/user";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {createLogger} from "../../services/Logger/Logger.pino";

export const fetchUserById = httpHandler(
  async ({query, headers}) => {
    const logger =createLogger({
      name: "fetchUserById",
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        functionExecutionId: v4(),
        correlationId: headers["x-correlation-id"] as string || v4(),
      },
    });
    logger.info("fetchUserById: begin", {
      query: query,
    });
    const {
      id,
      includeGames = false,
    } = query;
    if (!id) {
      logger.warning("fetchUserById: id is required");
      return {
        statusCode: 400,
        response: {
          message: "id is required",
        },
      };
    }
    const shouldIncludeGames = includeGames === "true";
    const db = getDb();
    const result: Record<string, unknown> = await db.query.users.findFirst({
      where: eq(users.id, String(id)),
      with: {
        gamesAsParticipant: shouldIncludeGames as true,
        gamesAsAdmin: shouldIncludeGames as true,
      },
    }).then((res) => ({
      ...res,
      sqlId: res?.id,
    }));
    if (!result) {
      logger.warning("fetchUserById: user not found", {
        id,
      });
      return {
        statusCode: 404,
        body: {
          response: "User not found",
        },
      };
    }
    logger.info("fetchUserById: success", {
      result,
    });
    result["sqlId"] = result.id;

    return {
      statusCode: 200,
      response: result as User,
    };
  }, {
    querySchema: z.object({
      id: z.string(),
      includeGames: z.string().optional(),
    }),
    responseSchema: userSchema,
    useAppCheck: true,
  });
