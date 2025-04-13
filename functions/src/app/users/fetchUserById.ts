import {sqlUserSchema} from "@potw/schemas";
import {eq} from "drizzle-orm";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {HttpHandlerFunction} from "../../functionWrapper/types";
import {NotFoundError} from "../../utils/Errors";

const querySchema = z.object({
  id: z.string(),
  includeGames: z.string().optional(),
});

const functionConfig = {
  querySchema: querySchema,
  responseSchema: sqlUserSchema,
  useAppCheck: true,
  vpcConnector: "psql-connector",
  vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
} as const;

const fetchUserByIdHandler: HttpHandlerFunction<typeof functionConfig> = async ({query}) => {
  const logger = getLogger();
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
    throw new NotFoundError("User not found");
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
      aboutMe: userResult.aboutMe,
      avatarUrl: userResult.avatarUrl,
    },
  };
};

export const fetchUserById = httpHandler(fetchUserByIdHandler, functionConfig);
