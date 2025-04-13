import {sqlGameWithRelationsSchema, TSqlGame} from "@potw/schemas";
import {z} from "zod";

import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {fetchManyGames} from "../../services/games/fetchManyGames";
import {fetchGamesForUser} from "../../services/users/fetchGamesForUser";

export const fetchGames = httpHandler(async function gamesFetch({
  query,
}) {
  const logger = getLogger();
  logger.info("fetchGames begin", {query});

  const userId = query.userId;

  let games:TSqlGame[];

  if (userId) {
    games = await fetchGamesForUser(userId as string);
    return {
      response: {
        games,
      },
    };
  }

  games = await fetchManyGames({
    limit: 20,
    includePrivate: false,
  });

  return {
    response: {
      games,
    },
  };
}, {
  functionName: "fetchGames",
  querySchema: z.object({
    userId: z.string().optional(),
  }),
  responseSchema: z.object({
    games: z.array(sqlGameWithRelationsSchema),
  }),
  vpcConnector: "psql-connector",
  vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
});
