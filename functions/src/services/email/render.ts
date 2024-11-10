import * as fs from "node:fs";
import path from "node:path";

import Handlebars from "handlebars";

export const TemplateName = {
  invite: "invite",
  joinRequestReceived: "joinRequestReceived",
} as const;

export type TemplateName = typeof TemplateName[keyof typeof TemplateName];

export interface TemplateParams {
    invite: {
        inviteUrl: string;
        gameName: string;
        invitorName: string;
        websiteUrl: string;
    };
    joinRequestReceived: {
        requesteeProfileUrl: string;
        requesteeName: string;
        gameName: string;
        gameUrl: string;
        websiteUrl: string;
    };
}

type Templates = {
    [key in TemplateName]: HandlebarsTemplateDelegate<TemplateParams[key]>;
};
const templates: Templates = Object.values(TemplateName).reduce(
  (acc: Templates, templateName: TemplateName) => {
    acc[templateName] = Handlebars.compile<TemplateParams[TemplateName]>(loadTemplate(templateName));
    return acc;
  },
  {} as Templates
);

export const renderTemplate = <T extends TemplateName>(template: T, params: TemplateParams[T]): string => {
  return templates[template](params);
};


function loadTemplate(templateName: TemplateName): string {
  const templateDir = path.join(__dirname, "../../../assets", "templates");
  return fs.readFileSync(path.join(templateDir, `${templateName}.html.handlebars`), "utf8");
}
