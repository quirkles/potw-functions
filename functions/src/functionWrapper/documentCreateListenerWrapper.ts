import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {v4} from "uuid";
import {TypeOf, z, ZodError, ZodSchema} from "zod";

import {getConfig} from "../config";
import {createLogger} from "../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../services/firebase";
import {BadRequestError} from "../utils/Errors";
import {flattenObject} from "../utils/object";

import {
  OnDocumentCreatedHandlerFunction,
  OnDocumentCreatedHandlerFunctionConfig,
} from "./types";

import {asyncLocalStorage, functionInstanceId} from "./index";


export function documentCreateListenerHandler<
    NewDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
    Document extends string
>(
  func: OnDocumentCreatedHandlerFunction<NewDocumentSchema, ParamsSchema>,
  config: OnDocumentCreatedHandlerFunctionConfig<NewDocumentSchema, ParamsSchema, Document>
): ReturnType<typeof onDocumentCreated> {
  const {
    document,
    newDocumentSchema = z.any().optional(),
    paramsSchema = z.any().optional(),
    functionName,
    ...restConfig
  } = config;
  return onDocumentCreated({
    document,
    ...restConfig,
  }, async (event) => {
    const snapshot = event.data ?? null;
    if (!snapshot) {
      throw new Error("No snapshot provided");
    }
    const data = snapshot.data();
    const logLabels: Record<string, string> = {
      requestId: v4(),
      correlationId: v4(),
      functionInstanceId,
      functionExecutionId: v4(),
      ...flattenObject({
        eventParams: event.params,
        eventData: data,
      }),
    };
    const logger = createLogger({
      logName: `documentSubHandler.${functionName || func.name || "unknownFunction"}`,
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        ...logLabels,
      },
    });
    logger.debug("Received request", {
      event,
      data,
    });
    initializeAppAdmin();
    let validatedBody: NewDocumentSchema extends ZodSchema ? TypeOf<NewDocumentSchema> : unknown;
    try {
      validatedBody = newDocumentSchema.parse(data);
      logger.debug("Validated request body", {
        validatedBody,
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
        return func(validatedBody, validatedParams);
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
