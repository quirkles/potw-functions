import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {sign} from "jsonwebtoken";

import {OAuth2Client} from "google-auth-library";

import {getConfig} from "../../config";

import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField} from "../../services/firestore/user";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";

export const handleGoogleLogin = onRequest({cors: true}, async (request, response) => {
  initializeAppAdmin();
  const client = new OAuth2Client();
  const tokenInfo = await client.getTokenInfo(request.body.token);
  logger.info(tokenInfo);
  if (!tokenInfo.email) {
    response.status(401).send("Invalid token");
    return;
  }
  const firestoreId = await saveOrGetId(tokenInfo.email);

  const db = getDb();

  const saved = await db.insert(users).values({
    email: tokenInfo.email,
    firestoreId,
  }).returning({insertedId: users.id}).onConflictDoUpdate({
    target: users.email,
    set: {
      email: tokenInfo.email,
    },
  });

  const sqlId = saved[0].insertedId;

  await setField(firestoreId, "sqlId", sqlId);

  const payload = {
    email: tokenInfo.email,
    firestoreId,
    sqlId,
  };

  logger.info("payload");
  logger.info(payload);
  const token = sign(payload, getConfig().jwtSecret);
  response.json({token});
  return;
});
