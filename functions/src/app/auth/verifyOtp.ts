import {onRequest} from "firebase-functions/v2/https";
import {sign} from "jsonwebtoken";
import {v4} from "uuid";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {createLogger} from "../../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField, verifyOtp} from "../../services/firestore/user";
export const verifyOtpFn = onRequest({cors: true}, async (req, resp) => {
  initializeAppAdmin();
  const logger = createLogger({
    logName: "verifyOtpFn",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: req.headers["x-correlation-id"] as string || v4(),
    },
  });

  logger.info("verifyOTPBegin", {
    body: req.body,
  });

  const {otp, codeVerifier} = req.body;
  const result = await verifyOtp(otp, codeVerifier);
  if (result instanceof Error) {
    logger.warning("verifyOtp: Error", {
      err: result,
    });
    resp.status(401).json({error: result.message});
    return;
  }
  logger.info("verifyOtp: Result", {
    result,
  });
  const firestoreId = await saveOrGetId(result, true);

  logger.info("verifyOtp: firestoreId", {
    firestoreId,
  });

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

  logger.info("verifyOtp: sqlId", {
    sqlId,
  });

  await setField(firestoreId, "sqlId", sqlId);

  const token = sign({
    email: result,
    firestoreId,
    sqlId,
  }, "super-secret");
  logger.info("verifyOtp: token", {
    token,
  });
  resp.json({token});
  return;
});
