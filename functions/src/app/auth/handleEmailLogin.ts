import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

import {onRequest} from "firebase-functions/v2/https";

import {v4} from "uuid";

import {getConfig} from "../../config";

import {createOtp, saveOrGetId} from "../../services/firestore/user";
import {initializeAppAdmin} from "../../services/firebase";
import {createLogger} from "../../services/Logger/Logger.pino";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sg = require("@sendgrid/mail");

export const handleEmailLogin = onRequest({
  cors: true,
}, async (req, resp) => {
  const {
    body,
  } = req;

  const logger = createLogger({
    name: "createUser",
    labels: {
      functionExecutionId: v4(),
      correlationId: req.headers["x-correlation-id"] as string || v4(),
    },
    shouldLogToConsole: getConfig().env === "local",
  });

  initializeAppAdmin();

  logger.info("handleEmailLogin: begin", {
    body,
  });

  const email = body.email;
  if (!email || !email.length) {
    logger.warning("handleEmailLogin: email is required");
    resp.status(400).send("Email is required");
    return;
  }
  const otpResponse = await saveOrGetId(email, true).then((id) => {
    return createOtp(id, email);
  });

  logger.debug("handleEmailLogin: otpResponse", {
    otpResponse,
  });

  const {otp, codeVerifier} = otpResponse;
  const secretManagerClient = new SecretManagerServiceClient();
  const [secretResponse] = await secretManagerClient.accessSecretVersion({
    name: "projects/242205172363/secrets/sendgrid-potw-send-api-key/versions/latest",
  });
  const apiKey = secretResponse.payload?.data?.toString();
  if (!apiKey) {
    logger.error("handleEmailLogin: No api key found");
    resp.status(500).send("No api key found");
    return;
  }
  const msg = {
    to: email,
    from: "al.quirk@gmail.com", // Use the email address or domain you verified above
    subject: "Here is your OTP",
    // eslint-disable-next-line max-len
    text: `Click here: ${getConfig().webUrl}/login?otp=${otp}&otpCodeVerifier=${codeVerifier}. Or use the code: ${otp} to login. This code will expire in 5 minutes.`,
    // eslint-disable-next-line max-len
    html: `<p>Click <a href="${getConfig().webUrl}/login?otp=${otp}&otpCodeVerifier=${codeVerifier}">here</a> or use the code: ${otp} to login. This code will expire in 5 minues.</p>`,
  };
  sg.setApiKey(apiKey);
  try {
    await sg.send(msg);
  } catch (err) {
    logger.error("handleEmailLogin: Error sending email", {
      err,
    });
  }
  resp.json({
    codeVerifier,
  });
  return;
});
