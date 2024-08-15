import {TypeOf, z, ZodError, ZodSchema} from "zod";
import {v4} from "uuid";
import {req as reqSerializer} from "pino-std-serializers";

import {createLogger} from "../services/Logger/Logger.pino";
import {HandlerFunction, HandlerFunctionConfig} from "./types";
import {asyncLocalStorage, functionInstanceId} from "./index";
import {HttpsFunction, onRequest} from "firebase-functions/v2/https";
import {flattenObject} from "../utils/object";
import {getConfig} from "../config";


export function httpHandler<
    PayloadSchema extends ZodSchema,
    ResponseSchema extends ZodSchema,
>(
  func: HandlerFunction<PayloadSchema, ResponseSchema>,
  config?: HandlerFunctionConfig<PayloadSchema, ResponseSchema>
): HttpsFunction {
  const {
    payloadSchema = z.any().optional(),
    responseSchema = z.any().optional(),
  } = config || {};
  return onRequest(async (req, res) => {
    const logLabels: Record<string, string> = {
      requestId: v4(),
      functionInstanceId,
      functionExecutionId: v4(),
    };
    const {
      body = {},
      headers = {},
    } = req;

    const correlationId = String(headers["x-correlation-id"] || v4());

    const logger = createLogger({
      logName: "httpHandler",
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        ...logLabels,
        ...flattenObject({payload: body}),
        correlationId,
      },
    });

    logger.info("Request received", {
      httpRequest: reqSerializer(req),
    });

    let validatedBody: TypeOf<PayloadSchema>;
    try {
      validatedBody = payloadSchema.parse(body);
      logger.debug("Validated request body", {
        validatedBody,
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

    let result: unknown | null = null;
    try {
      logger.debug("Running handler");
      result = await asyncLocalStorage.run({logger}, async () => {
        return func(validatedBody);
      });
      logger.debug("Handler completed", {
        result,
      });
    } catch (e) {
      logger.error("Error in handler", {
        err: e,
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
  });
}
