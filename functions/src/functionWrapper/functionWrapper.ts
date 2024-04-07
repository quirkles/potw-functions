import {AsyncLocalStorage} from "async_hooks";

import {type Request, type Response} from "express";
import {TypeOf, z, ZodError, ZodSchema} from "zod";
import {v4} from "uuid";

import {createLogger, Logger} from "./logger";
import {OrPromise} from "../typeUtils";

const functionInstanceId = v4();

const asyncLocalStorage = new AsyncLocalStorage<{
  logger: Logger;
}>();

type HandlerFunctionConfig<
  BodySchema extends ZodSchema,
  ResponseSchema extends ZodSchema,
> = {
    bodySchema?: BodySchema,
    responseSchema?: ResponseSchema,
};

type HandlerFunction<
  BodySchema extends ZodSchema,
  ResponseSchema extends ZodSchema,
> = (
    body: BodySchema extends undefined ? unknown : TypeOf<BodySchema>
) => ResponseSchema extends undefined ? unknown : OrPromise<TypeOf<ResponseSchema>>;
export function httpHandler<
    BodySchema extends ZodSchema,
    ResponseSchema extends ZodSchema
>(
  func: HandlerFunction<BodySchema, ResponseSchema>,
  config: HandlerFunctionConfig<BodySchema, ResponseSchema> = {}
): (req: Request, res: Response) => void | Promise<void> {
  const {
    bodySchema = z.any(),
    responseSchema = z.any(),
  } = config || {};
  return async (req, res) => {
    const logLabels: Record<string, string> = {
      requestId: v4(),
      functionInstanceId,
    };
    const {
      body = {},
      headers = {},
    } = req;
    const correlationId = headers["x-correlation-id"];
    if (correlationId) {
      logLabels["correlationId"] = String(correlationId);
    }
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        logLabels[`body_${key}`] = typeof req.body[key] === "string" ? req.body[key] : JSON.stringify(req.body[key]);
      }
    }

    const logger = createLogger(logLabels);

    let validatedBody: TypeOf<BodySchema>;
    try {
      validatedBody = bodySchema.parse(body);
      logger.debug("Validated request body", validatedBody);
    } catch (e) {
      let errorMessage: string | Record<string, unknown> = (e as Error).message;
      if (e instanceof ZodError) {
        errorMessage = e.format();
      }
      logger.warn("Invalid request body", {
        error: errorMessage,
        body,
      });
      res.status(400).json({
        error: errorMessage,
        message: "Invalid request body",
      });
      return;
    }
    let result: unknown | null = null;
    try {
      result = await asyncLocalStorage.run({logger}, async () => {
        return func(validatedBody);
      });
    } catch (e) {
      logger.error("Error in handler", {
        error: e,
        body,
      });
      res.status(500).send("Internal server error");
      return;
    }
    try {
      res.status(200).json(
        responseSchema.parse(result)
      );
      return;
    } catch (e) {
      logger.warn("Invalid response body", e);
      res.status(200).send(result);
    }
  };
}

export function getLogger(): Logger {
  const logger = asyncLocalStorage.getStore()?.logger;
  if (!logger) {
    throw new Error("Logger not found in asyncLocalStorage");
  }
  return logger;
}
