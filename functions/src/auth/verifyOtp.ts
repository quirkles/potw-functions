import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {saveOrGetId, verifyOtp} from "../services/firestore/user";
import {initializeAppAdmin} from "../services/firebase";
import {sign} from "jsonwebtoken";
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
  const id = await saveOrGetId(result, true);
  const token = sign({
    email: result,
    id,
  }, "super-secret");
  resp.json({token});
  return;
});
