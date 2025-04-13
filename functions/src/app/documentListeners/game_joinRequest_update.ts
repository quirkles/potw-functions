import {z} from "zod";

import {VPC_CONNECTOR} from "../../config";
import {getLogger} from "../../functionWrapper";
import {
  documentUpdateListenerHandler,
} from "../../functionWrapper/documentUpdateListenerWrapper";
import {sendRequestToJoinGame} from "../../services/email/requestToJoinGame";
import {fetchGameWithAdmin} from "../../services/games/fetchGameWithAdmin";
import {
  fetchTSqlUserData,
} from "../../services/users/fetchUserData";

export const onGameJoinUpdate = documentUpdateListenerHandler(
  async function gameJoinUpdateHandler(_, after, params) {
    const logger = getLogger();
    logger.info("onGameJoinUpdate: begin", {
      params,
      before: _,
      after,
    });
    const {status} = after;
    if (status === "pending") {
      logger.info("onGameJoinUpdate: status is pending. Ignoring", {
        status,
      });
      return;
    }
    const {gameId, requesteeId} = params;
    logger.info("onGameJoinUpdate: fetching user data for requestee");
    const requestee = await fetchTSqlUserData({firestoreId: requesteeId});
    logger.info("onGameJoinUpdate: fetched user data for requestee", {
      requestee,
    });
    logger.info("onGameJoinUpdate: fetching game and admin data");
    const {
      game, admin,
    } = await fetchGameWithAdmin({firestoreId: gameId});
    logger.info("onGameJoinUpdate: fetched game and admin data", {
      game,
      admin,
    });
    logger.info("onGameJoinUpdate: sending notification to admin");

    await sendRequestToJoinGame(admin.email, requestee, game);
  }, {
    document: "games/{gameId}/joinRequests/{requesteeId}",
    afterDocumentSchema: z.object({
      status: z.string(),
    }),
    paramsSchema: z.object({
      gameId: z.string(),
      requesteeId: z.string(),
    }),
    functionName: "onGameJoinRequest",
    vpcConnector: VPC_CONNECTOR,
    vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
  });
