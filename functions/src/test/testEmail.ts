import {faker} from "@faker-js/faker";
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
      inviteUrl: faker.internet.url(),
      gameName: faker.lorem.words(),
      invitorName: faker.person.fullName(),
      websiteUrl: faker.internet.url(),
    };
  case "joinRequestReceived":
    return {
      requesteeProfileUrl: faker.internet.url(),
      requesteeName: faker.person.fullName(),
      gameName: faker.lorem.words(),
      gameUrl: faker.internet.url(),
      websiteUrl: faker.internet.url(),
    };
  }
}
