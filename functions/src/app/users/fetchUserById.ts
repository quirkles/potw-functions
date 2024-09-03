import {eq} from "drizzle-orm";
import {v4} from "uuid";
import {z} from "zod";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {HandlerFunction} from "../../functionWrapper/types";
import {createLogger} from "../../services/Logger/Logger.pino";
import {userSchema} from "../../validation/user";

const querySchema = z.object({
  id: z.string(),
  includeGames: z.string().optional(),
});

const anySchema = z.any();

const handler: HandlerFunction<typeof anySchema, typeof querySchema, typeof userSchema> = async ({query, headers}) => {
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
  const db = getDb();

  const userResult = await db.query.users.findFirst({
    where: eq(users.id, String(id)),
    with: {
      gamesAsParticipant: {
        with: {
          game: true,
        },
      },
      gamesAsAdmin: true,
    },
  });

  if (!userResult) {
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
    result: userResult,
  });

  const gamesAsParticipant = userResult.gamesAsParticipant.map((gameToUser) => {
    return {
      ...gameToUser.game,
    };
  });

  return {
    statusCode: 200,
    response: {
      sqlId: userResult.id,
      username: userResult.username,
      email: userResult.email,
      firestoreId: userResult.firestoreId,
      createdAt: userResult.createdAt,
      updatedAt: userResult.updatedAt,
      gamesAsParticipant,
      gamesAsAdmin: userResult.gamesAsAdmin,
    },
  };
};

export const fetchUserById = httpHandler(handler, {
  querySchema: querySchema,
  responseSchema: userSchema,
  useAppCheck: true,
});
