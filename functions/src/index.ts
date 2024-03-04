/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {OAuth2Client} from "google-auth-library";
import {sign} from "jsonwebtoken";
import {initializeApp, App} from "firebase-admin/app";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {saveOrGetId} from "./services/firestore/user";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
let app: App;
export const handleGoogleLogin = onRequest({cors: true}, async (request, response) => {
  if (!app) {
    app = initializeApp();
  }
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
