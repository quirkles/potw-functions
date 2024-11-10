import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {v4} from "uuid";
import {TypeOf, z, ZodError, ZodSchema} from "zod";

import {getConfig} from "../config";
import {createLogger} from "../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../services/firebase";
import {BadRequestError} from "../utils/Errors";
import {flattenObject} from "../utils/object";

import {
  OnDocumentUpdateHandlerFunction,
  OnDocumentUpdateHandlerFunctionConfig,
} from "./types";

import {asyncLocalStorage, functionInstanceId} from "./index";


export function documentUpdateListenerHandler<
    BeforeDocumentSchema extends ZodSchema | undefined,
    AfterDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
    Document extends string
>(
  func: OnDocumentUpdateHandlerFunction<BeforeDocumentSchema, AfterDocumentSchema, ParamsSchema>,
  config: OnDocumentUpdateHandlerFunctionConfig<BeforeDocumentSchema, AfterDocumentSchema, ParamsSchema, Document>
): ReturnType<typeof onDocumentUpdated> {
  const {
    document,
    beforeDocumentSchema = z.any().optional(),
    afterDocumentSchema = z.any().optional(),
    paramsSchema = z.any().optional(),
    functionName,
    ...restConfig
  } = config;
  return onDocumentUpdated({
    document,
    ...restConfig,
  }, async (event) => {
    const snapshot = event.data ?? null;
    if (!snapshot) {
      throw new Error("No snapshot provided");
    }
    const beforeData = snapshot.before.data();
    const afterData = snapshot.after.data();

    const logLabels: Record<string, string> = {
      requestId: v4(),
      correlationId: v4(),
      functionInstanceId,
      functionExecutionId: v4(),
      ...flattenObject({
        eventParams: event.params,
      }),
    };
    const logger = createLogger({
      logName: `documentUpdateSubHandler.${functionName || func.name || "unknownFunction"}`,
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        ...logLabels,
      },
    });
    logger.debug("Received request", {
      event,
      params: event.params,
      beforeData,
      afterData,
    });
    initializeAppAdmin();

    let validatedBeforeBody: BeforeDocumentSchema extends ZodSchema ? TypeOf<BeforeDocumentSchema> : unknown;

    try {
      validatedBeforeBody = beforeDocumentSchema.parse(beforeData);
      logger.debug("Validated request body", {
        validatedBeforeBody,
      });
    } catch (e) {
      let errorMessage: string | Record<string, unknown> = (e as Error).message;
      if (e instanceof ZodError) {
        errorMessage = e.format();
      }
      logger.warn("Invalid document data", {
        error: errorMessage,
      });
      throw new BadRequestError("Invalid document data");
    }

    let validatedAfterBody: AfterDocumentSchema extends ZodSchema ? TypeOf<AfterDocumentSchema> : unknown;

    try {
      validatedAfterBody = afterDocumentSchema.parse(afterData);
      logger.debug("Validated request body", {
        validatedAfterBody,
      });
    } catch (e) {
      let errorMessage: string | Record<string, unknown> = (e as Error).message;
      if (e instanceof ZodError) {
        errorMessage = e.format();
      }
      logger.warn("Invalid document data", {
        error: errorMessage,
      });
      throw new BadRequestError("Invalid document data");
    }

    let validatedParams: ParamsSchema extends ZodSchema ? TypeOf<ParamsSchema> : unknown;

    try {
      validatedParams = paramsSchema.parse(event.params);
      logger.debug("Validated request params", {
        validatedParams,
      });
    } catch (e) {
      let errorMessage: string | Record<string, unknown> = (e as Error).message;
      if (e instanceof ZodError) {
        errorMessage = e.format();
      }
      logger.warn("Invalid params", {
        error: errorMessage,
      });
      throw new BadRequestError("Invalid params");
    }
    try {
      logger.debug("Running handler");
      const result = await asyncLocalStorage.run({logger}, async () => {
        return func(validatedBeforeBody, validatedAfterBody, validatedParams);
      });
      logger.debug("Handler completed", {
        result,
      });
      return;
    } catch (e) {
      logger.error("Error in handler", {
        err: e,
      });
      return;
    }
  });
}
