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
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
>(
  func: HandlerFunction<BodySchema, QuerySchema, ResponseSchema>,
  config?: HandlerFunctionConfig<BodySchema, QuerySchema, ResponseSchema>
): HttpsFunction {
  const {
    bodySchema = z.any().optional(),
    querySchema = z.any().optional(),
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
      query = {},
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

    let validatedBody: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown;
    try {
      validatedBody = bodySchema.parse(body);
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

    let validatedQuery: QuerySchema extends ZodSchema ? TypeOf<QuerySchema> : unknown;

    try {
      validatedQuery = querySchema.parse(query);
      logger.debug("Validated request query", {
        validatedQuery,
      });
    } catch (e) {
      let errorMessage: string | Record<string, unknown> = (e as Error).message;
      if (e instanceof ZodError) {
        errorMessage = e.format();
      }
      logger.warn("Invalid request query", {
        error: errorMessage,
        query,
      });
      res.status(400).json({
        error: errorMessage,
        message: "Invalid request query",
      });
      return;
    }

    let response: unknown | null = null;
    let statusCode: number = 200;
    try {
      logger.debug("Running handler");
      const result = await asyncLocalStorage.run({logger}, async () => {
        return func({
          body: validatedBody,
          query: validatedQuery,
        });
      });
      if (hasResponse(result)) {
        response = result.response;
      }
      if (hasStatusCode(result)) {
        statusCode = result.statusCode;
      }
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
      res.status(statusCode).json(
        responseSchema.parse(response)
      );
      return;
    } catch (err) {
      logger.warn("Invalid response body", {
        err,
        body: response,
      });
      res.status(statusCode).send(response);
    }
  });
}

function hasResponse(result: any): result is { response: unknown } {
  return result && "response" in result;
}

function hasStatusCode(result: any): result is { statusCode: number } {
  return result && "statusCode" in result;
}
