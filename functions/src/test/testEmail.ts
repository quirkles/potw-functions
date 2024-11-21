import {z} from "zod";

import {getLogger} from "../functionWrapper";
import {httpHandler} from "../functionWrapper/httpfunctionWrapper";
import {renderTemplate, TemplateName, TemplateParams} from "../services/email/render";

export const testEmail = httpHandler(function testEmail(payload) {
  const logger = getLogger();
  logger.info("testEmail", payload);
  const {query} = payload;
  const template = query.template as TemplateName;
  const params = getFakePayload(template);
  console.log("params", params);
  const rendered = renderTemplate(template, params);
  return {
    response: rendered,
  };
}, {
  querySchema: z.object({
    template: z.enum(["invite", "joinRequestReceived"]),
  }),
  rawHtmlResponse: true,
});

function getFakePayload(template: TemplateName): TemplateParams[typeof template] {
  switch (template) {
  case "invite":
    return {
      inviteUrl: "www.example.com",
      gameName: "Pick of the Week: work",
      invitorName: "Admin",
      websiteUrl: "www.example.com",
    };
  case "joinRequestReceived":
    return {
      requesteeProfileUrl: "www.example.com",
      requesteeName: "John Doe",
      gameName: "Pick of the Week: work",
      gameUrl: "www.example.com/game",
      websiteUrl: "www.example.com/website",
    };
  }
}
