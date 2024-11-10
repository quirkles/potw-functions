import {getAppCheck} from "firebase-admin/app-check";
import {HttpsFunction, onRequest} from "firebase-functions/v2/https";
import {req as reqSerializer} from "pino-std-serializers";
import {v4} from "uuid";
import {TypeOf, ZodError, ZodSchema} from "zod";

import {getConfig} from "../config";
import {createLogger} from "../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../services/firebase";
import {TokenBody, verifyToken} from "../services/jwt/jwt";
import {getResponseFromError} from "../utils/Errors";
import {flattenObject, isObject} from "../utils/object";

import {HttpHandlerFunction, HttpHandlerFunctionConfig} from "./types";

import {asyncLocalStorage, functionInstanceId} from "./index";


export function httpHandler<
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
    RequireAuthToken extends boolean,
>(
  func: HttpHandlerFunction<BodySchema, QuerySchema, ResponseSchema, RequireAuthToken>,
  config?: HttpHandlerFunctionConfig<BodySchema, QuerySchema, ResponseSchema, RequireAuthToken>
): HttpsFunction {
  const {
    bodySchema,
    querySchema,
    responseSchema,
    useAppCheck = false,
    functionName,
    rawHtmlResponse,
    ...rest
  } = config || {};
  return onRequest({
    cors: config?.cors || true,
    invoker: "public",
    ...rest,
  }, async (req, res) => {
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
      logName: `httpHandler.${functionName || func.name || "unknownFunction"}`,
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

    logger.info("Initializing admin app");

    initializeAppAdmin();

    if (useAppCheck) {
      const appCheckToken = String(headers["x-firebase-appcheck"]);
      if (!appCheckToken) {
        logger.warn("Request without App Check token");
        res.status(401).send("Unauthorized");
        return;
      }
      try {
        logger.warn("Verifying App Check token", {
          appCheckToken,
        });
        const appCheckClaims = await getAppCheck().verifyToken(appCheckToken);

        logger.debug("App Check token verified", {
          appCheckClaims,
        });
      } catch (err) {
        logger.warn("Error verifying token", {
          err,
        });
        res.status(401).send("Unauthorized");
        return;
      }
    }

    let validatedBody: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown;
    try {
      if (bodySchema) {
        validatedBody = bodySchema.parse(body);
        logger.debug("Validated request body", {
          validatedBody,
        });
      } else {
        logger.debug("No body schema provided, skipping body validation");
      }
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
      if (querySchema) {
        validatedQuery = querySchema.parse(query);
        logger.debug("Validated request query", {
          validatedQuery,
        });
      } else {
        logger.debug("No query schema provided, skipping query validation");
      }
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

    let tokenPayload: TokenBody | Record<string, string> = {};
    if (config?.requireAuthToken) {
      let token:string | undefined = headers["authorization"];
      if (!token) {
        logger.warn("JWT token is required but missing in request");
        res.status(401).send("Unauthorized");
        return;
      }
      token = token.replace("Bearer ", "");


      try {
        tokenPayload = verifyToken(token);
      } catch (err) {
        logger.warn("Error verifying JWT token", {
          err,
        });
        res.status(401).send("Unauthorized");
        return;
      }
    }

    try {
      logger.debug("Running handler");
      const result = await asyncLocalStorage.run({logger}, async () => {
        return func({
          body: validatedBody,
          query: validatedQuery,
          headers: headers as Record<string, string>,
          tokenPayload: tokenPayload as TokenBody,
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
      const {
        response,
        statusCode,
      } = getResponseFromError(e as Error);
      res.status(statusCode).send(response);
      return;
    }
    try {
      if (!responseSchema) {
        logger.debug("No response schema provided, sending response as is");
        if (rawHtmlResponse) {
          console.log("###\nrawHtmlResponse\n###");
          res.set("Content-Type", "text/html").status(statusCode).send(response);
          return;
        }
        res.status(statusCode).json(response);
        return;
      }
      if (rawHtmlResponse) {
        console.log("###\nrawHtmlResponse\n###");
        res.set("Content-Type", "text/html").status(statusCode).send(response);
        return;
      }
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

function hasResponse(result: unknown): result is { response: unknown } {
  return Boolean(result && isObject(result) && "response" in result);
}

function hasStatusCode(result: unknown): result is { statusCode: number } {
  return Boolean(result && isObject(result) && "statusCode" in result);
}
