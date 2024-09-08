import {sign} from "jsonwebtoken";
import {v4} from "uuid";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {createLogger} from "../../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField, verifyOtp} from "../../services/firestore/user";
import {UnauthorizedError} from "../../utils/Errors";
export const verifyOtpFn = httpHandler(async ({
  body,
  headers,
}) => {
  initializeAppAdmin();
  const logger = createLogger({
    logName: "verifyOtpFn",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: headers["x-correlation-id"] as string || v4(),
    },
  });

  logger.info("verifyOTPBegin", {
    body: body,
  });

  const {otp, codeVerifier} = body;
  const result = await verifyOtp(otp, codeVerifier);
  if (result instanceof Error) {
    logger.warning("verifyOtp: Error", {
      err: result,
    });
    throw new UnauthorizedError("Invalid OTP");
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
  }, getConfig().jwtSecret);
  logger.info("verifyOtp: token", {
    token,
  });
  return {
    response: {
      token,
    },
  };
});
