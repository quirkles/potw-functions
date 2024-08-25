import {z} from "zod";

import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {initializeGameWeeksForGame} from "../../services/games/intializeNextGameWeeks";
import {GameWeek} from "../gameWeeks/schemas";

export const initializeGameWeeks = httpHandler(async function({body}): Promise<{response: GameWeek[]}> {
  const {gameId, weeksToCreate} = body;
  const logger = getLogger();
  logger.info("initializeGameWeeks: begin", {
    gameId,
    weeksToCreate,
  });

  const result = await initializeGameWeeksForGame(gameId, weeksToCreate);

  return {
    response: result,
  };
}, {
  bodySchema: z.object({
    gameId: z.string(),
    weeksToCreate: z.number(),
  }),
});
