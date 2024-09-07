import {z} from "zod";

import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {fetchManyGames} from "../../services/games/fetchManyGames";
import {fetchGamesForUser} from "../../services/users/fetchGamesForUser";
import {Game} from "../../validation/game";
import {gameWithRelationsSchema} from "../../validation/withRelations";

export const fetchGames = httpHandler(async ({
  query,
}) => {
  const logger = getLogger();
  logger.info("fetchGames begin", {query});

  const userId = query.userId;

  let games: Game[];

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
  querySchema: z.object({
    userId: z.string().optional(),
  }),
  responseSchema: z.object({
    games: z.array(gameWithRelationsSchema),
  }),
});
