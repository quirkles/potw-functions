import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {sign} from "jsonwebtoken";

import {initializeAppAdmin} from "../services/firebase";
import {saveOrGetId} from "../services/firestore/user";

export const handleSpotifyLogin = onRequest({cors: true}, async (req, resp) => {
  initializeAppAdmin();
  logger.info(`body: ${JSON.stringify(req.body)}`);
  logger.info(`query: ${JSON.stringify(req.query)}`);
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + req.body.token,
    },
  });

  const data = await response.json();

  logger.info("from spotify", data);

  const id = await saveOrGetId(data.email);
  const token = sign({
    email: data.email,
    id,
  }, "super-secret");
  resp.json({token});
  return;
});
