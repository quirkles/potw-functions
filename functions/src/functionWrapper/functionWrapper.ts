import {AsyncLocalStorage} from "async_hooks";

import {IncomingHttpHeaders} from "http";
import {type Request, type Response} from "express";
import {TypeOf, z, ZodError, ZodSchema} from "zod";
import {v4} from "uuid";

import {type ObjectFromList, type OrPromise} from "../typeUtils";
import {Logger} from "../services/Logger/Logger";
import {createLogger} from "../services/Logger/Logger.pino";

const functionInstanceId = v4();

const asyncLocalStorage = new AsyncLocalStorage<{
  logger: Logger;
}>();

type HandlerFunctionConfig<
  BodySchema extends ZodSchema,
  ResponseSchema extends ZodSchema,
  Headers extends Readonly<[string, ...(string)[]]>,
> = {
    bodySchema?: BodySchema,
    responseSchema?: ResponseSchema,
    useHeaders?: Headers
};

type HandlerFunction<
  BodySchema extends ZodSchema,
  ResponseSchema extends ZodSchema,
  Headers extends Readonly<[string, ...(string)[]]>,
> = (
    payload: {
      body: BodySchema extends undefined ? unknown : TypeOf<BodySchema>
      headers: Headers extends undefined ?
          IncomingHttpHeaders :
          ObjectFromList<Headers>
    }
) => ResponseSchema extends undefined ? unknown : OrPromise<TypeOf<ResponseSchema>>;
export function httpHandler<
    BodySchema extends ZodSchema,
    ResponseSchema extends ZodSchema,
    Headers extends Readonly<[string, ...(string)[]]>,
>(
  func: HandlerFunction<BodySchema, ResponseSchema, Headers>,
  config?: HandlerFunctionConfig<BodySchema, ResponseSchema, Headers>
): (req: Request, res: Response) => void | Promise<void> {
  const {
    bodySchema = z.any(),
    responseSchema = z.any(),
    useHeaders,
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

    const logger = createLogger(logLabels);

    let validatedHeaders: ObjectFromList<Headers>;
    if (useHeaders) {
      const headersSchema = z.record(
        z.enum(useHeaders),
        z.string().or(z.array(z.string()).or(z.undefined()))
      );
      try {
        validatedHeaders = headersSchema.parse(headers);
        logger.debug("Validated request headers", {
          headers: validatedHeaders,
        });
      } catch (e) {
        let errorMessage: string | Record<string, unknown> = (e as Error).message;
        if (e instanceof ZodError) {
          errorMessage = e.format();
        }
        logger.warn("Invalid request headers", {
          error: errorMessage,
          headers,
        });
        res.status(400).json({
          error: errorMessage,
          message: "Invalid request headers",
        });
        return;
      }
    }
    let validatedBody: TypeOf<BodySchema>;
    if (bodySchema) {
      try {
        const validatedBody = bodySchema.parse(body);
        logger.debug("Validated request body", {
          body: validatedBody,
        });
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
    }
    const correlationId = headers["x-correlation-id"];
    if (correlationId) {
      logLabels["correlationId"] = String(correlationId);
    }
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        logLabels[`body_${key}`] = typeof req.body[key] === "string" ? req.body[key] : JSON.stringify(req.body[key]);
      }
    }

    let result: unknown | null = null;
    try {
      logger.debug("Running handler");
      result = await asyncLocalStorage.run({logger}, async () => {
        return func({
          body: validatedBody,
          headers: (
              useHeaders ?
                validatedHeaders :
                headers
          ) as Headers extends undefined ? IncomingHttpHeaders : ObjectFromList<Headers>,
        });
      });
      logger.debug("Handler completed", {
        result,
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
    } catch (err) {
      logger.warn("Invalid response body", {
        err,
        body: result,
      });
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
