import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import * as sg from "@sendgrid/mail";

import {createOtpForEmail, saveOrGetId} from "../services/firestore/user";
import {initializeAppAdmin} from "../services/firebase";
import {getConfig} from "../config";
export const handleEmailLogin = onRequest({cors: true}, async (req, resp) => {
  initializeAppAdmin();
  logger.info(`body: ${JSON.stringify(req.body)}`);
  const email = req.body.email;
  const [_, otpResponse] = await Promise.all([
    saveOrGetId(email, true),
    createOtpForEmail(email),
  ]);
  const {otp, codeVerifier} = otpResponse;
  const secretManagerClient = new SecretManagerServiceClient();
  const [secretResponse] = await secretManagerClient.accessSecretVersion({
    name: "projects/242205172363/secrets/sendgrid-potw-send-api-key/versions/latest",
  });
  const apiKey = secretResponse.payload?.data?.toString();
  if (!apiKey) {
    logger.error("No api key found");
    resp.status(500).send("No api key found");
    return;
  }
  const msg = {
    to: email,
    from: "al.quirk@gmail.com", // Use the email address or domain you verified above
    subject: "Here is your OTP",
    // eslint-disable-next-line max-len
    text: `Click here: ${getConfig().webUrl}?otp=${otp}&otpCodeVerifier=${codeVerifier}. Or use the code: ${otp} to login. This code will expire in 5 minutes.`,
    // eslint-disable-next-line max-len
    html: `<p>Click <a href="${getConfig().webUrl}?otp=${otp}&otpCodeVerifier=${codeVerifier}">here</a> or use the code: ${otp} to login. This code will expire in 5 minues.</p>`,
  };
  sg.setApiKey(apiKey);
  try {
    await sg.send(msg);
  } catch (e) {
    logger.error("Error sending email", e);
  }
  resp.json({
    codeVerifier,
  });
  return;
});
