import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {sign} from "jsonwebtoken";

import {OAuth2Client} from "google-auth-library";

import {initializeAppAdmin} from "../services/firebase";
import {saveOrGetId} from "../services/firestore/user";

export const handleGoogleLogin = onRequest({cors: true}, async (request, response) => {
  initializeAppAdmin();
  logger.info("Hello logs!", {structuredData: true});
  logger.info(`body: ${JSON.stringify(request.body)}`);
  logger.info(`query: ${JSON.stringify(request.query)}`);
  const client = new OAuth2Client();
  const tokenInfo = await client.getTokenInfo(request.body.token);
  logger.info(tokenInfo);
  if (!tokenInfo.email) {
    response.status(401).send("Invalid token");
    return;
  }
  const id = await saveOrGetId(tokenInfo.email);
  const token = sign({
    email: tokenInfo.email,
    id,
  }, "super-secret");
  response.json({token});
  return;
});
