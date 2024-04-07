import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {sign} from "jsonwebtoken";

import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField} from "../../services/firestore/user";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";

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

  const firestoreId = await saveOrGetId(data.email);
  const db = getDb();

  const saved = await db.insert(users).values({
    email: data.email,
    firestoreId,
  }).returning({insertedId: users.id}).onConflictDoUpdate({
    target: users.email,
    set: {
      email: data.email,
    },
  });

  const sqlId = saved[0].insertedId;

  await setField(firestoreId, "sqlId", sqlId);

  await setField(firestoreId, "sqlId", sqlId);

  const token = sign({
    email: data.email,
    firestoreId,
    sqlId,
  }, "super-secret");

  resp.json({token});
  return;
});
