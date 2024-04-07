import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {sign} from "jsonwebtoken";

import {saveOrGetId, setField, verifyOtp} from "../../services/firestore/user";
import {initializeAppAdmin} from "../../services/firebase";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
export const verifyOtpFn = onRequest({cors: true}, async (req, resp) => {
  initializeAppAdmin();
  logger.info(`body: ${JSON.stringify(req.body)}`);
  const {otp, codeVerifier} = req.body;
  const result = await verifyOtp(otp, codeVerifier);
  logger.info(`result: ${result}`);
  if (result instanceof Error) {
    resp.status(401).json({error: result.message});
    return;
  }
  const firestoreId = await saveOrGetId(result, true);

  const db = getDb();

  const saved = await db.insert(users).values({
    email: result,
    firestoreId,
  }).returning({insertedId: users.id}).onConflictDoUpdate({
    target: users.email,
    set: {
      email: result,
    },
  });

  const sqlId = saved[0].insertedId;

  await setField(firestoreId, "sqlId", sqlId);

  const token = sign({
    email: result,
    firestoreId,
    sqlId,
  }, "super-secret");
  resp.json({token});
  return;
});
