import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

import {getLogger} from "../../functionWrapper";
import {getConfig} from "../../config";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sg = require("@sendgrid/mail");

export async function sendInviteToEmail(
  email: string,
  invitor:string,
): Promise<void> {
  const logger = getLogger();
  logger.info("sendInviteToEmail: begin", {
    email: email,
  });
  const secretManagerClient = new SecretManagerServiceClient();

  const [secretResponse] = await secretManagerClient.accessSecretVersion({
    name: "projects/242205172363/secrets/sendgrid-potw-send-api-key/versions/latest",
  });
  const apiKey = secretResponse.payload?.data?.toString();
  if (!apiKey) {
    logger.error("sendInviteToEmail: No sendgrid api key found");
    return;
  }
  const msg = {
    to: email,
    from: "al.quirk@gmail.com", // Use the email address or domain you verified above
    subject: "You've been invited to Pick of the Week!",
    // eslint-disable-next-line max-len
    text: `${invitor} has invited you to join their game in Pick of the Week. Click here to get started: ${getConfig().webUrl}/login`,
    // eslint-disable-next-line max-len
    html: `<p>${invitor} has invited you to join their game in Pick of the Week.<br/>Click <a href="${getConfig().webUrl}/login">here</a> to get started.</p>`,
  };
  logger.info("sendInviteToEmail: sending email", {
    email: email,
  });
  sg.setApiKey(apiKey);
  try {
    await sg.send(msg);
    logger.info("sendInviteToEmail: email sent", {
      email: email,
    });
  } catch (err) {
    logger.error("handleEmailLogin: Error sending email", {
      err,
    });
  }
}
