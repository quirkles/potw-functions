import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

import {getConfig} from "../../config";
import {getLogger} from "../../functionWrapper";
import {SqlGame} from "../../validation/sqlGame";
import {SqlUser} from "../../validation/sqlUser";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sg = require("@sendgrid/mail");

export async function sendRequestToJoinGame(
  email: string,
  requestee: SqlUser,
  game: SqlGame
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
    subject: "User!",
    // eslint-disable-next-line max-len
    text: `${requestee.username} has requested to join your game: ${game.name} in Pick of the Week. Click here to view the request.`,
    // eslint-disable-next-line max-len
    html: `<p>${requestee.username} has requested to join your game in potw .<br/>Click <a href="${getConfig().webUrl}/login">here</a> to view the request.</p>`,
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
