import {z} from "zod";

import {getLogger} from "../../functionWrapper";
import {
  documentCreateListenerHandler,
} from "../../functionWrapper/documentCreateListenerWrapper";
import {sendRequestToJoinGame} from "../../services/email/requestToJoinGame";
import {fetchGameWithAdmin} from "../../services/games/fetchGameWithAdmin";
import {
  fetchTSqlUserData,
} from "../../services/users/fetchUserData";

export const onGameJoinCreate = documentCreateListenerHandler(
  async function gameJoinCreateHandler(document, params) {
    const logger = getLogger();
    logger.info("onGameJoinRequest: begin", {
      document,
      params,
    });
    const {status} = document;
    if (status !== "pending") {
      logger.info("onGameJoinRequest: status is not pending", {
        status,
      });
      return;
    }
    const {gameId, requesteeId} = params;
    logger.info("onGameJoinRequest: fetching user data for requestee");
    const requestee = await fetchTSqlUserData({firestoreId: requesteeId});
    logger.info("onGameJoinRequest: fetched user data for requestee", {
      requestee,
    });
    logger.info("onGameJoinRequest: fetching game and admin data");
    const {
      game, admin,
    } = await fetchGameWithAdmin({firestoreId: gameId});
    logger.info("onGameJoinRequest: fetched game and admin data", {
      game,
      admin,
    });
    logger.info("onGameJoinRequest: sending notification to admin");

    await sendRequestToJoinGame(admin.email, requestee, game);
  }, {
    document: "games/{gameId}/joinRequests/{requesteeId}",
    newDocumentSchema: z.object({
      status: z.string(),
    }),
    paramsSchema: z.object({
      gameId: z.string(),
      requesteeId: z.string(),
    }),
    functionName: "onGameJoinRequest",
  });
