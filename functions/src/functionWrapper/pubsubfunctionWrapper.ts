import {CloudEvent} from "firebase-functions/lib/v2/core";
import {MessagePublishedData} from "firebase-functions/lib/v2/providers/pubsub";
import {onMessagePublished} from "firebase-functions/v2/pubsub";
import {v4} from "uuid";
import {TypeOf, z, ZodError, ZodSchema} from "zod";

import {getConfig} from "../config";
import {createLogger} from "../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../services/firebase";
import {BadRequestError} from "../utils/Errors";
import {flattenObject} from "../utils/object";

import {
  PubSubHandlerFunction,
  PubSubHandlerFunctionConfig,
} from "./types";

import {asyncLocalStorage, functionInstanceId} from "./index";


export function pubsubHandler<
    BodySchema extends ZodSchema | undefined,
>(
  func: PubSubHandlerFunction<BodySchema>,
  config: PubSubHandlerFunctionConfig<BodySchema>
): ((event: CloudEvent<MessagePublishedData<unknown>>) => Promise<void> | void) {
  const {
    bodySchema = z.any().optional(),
    functionName,
  } = config || {};
  return onMessagePublished({
    topic: config?.topic,
  }, async (payload) => {
    const logLabels: Record<string, string> = {
      requestId: v4(),
      functionInstanceId,
      functionExecutionId: v4(),
    };

    const {
      correlationId = v4(),
      ...rest
    } = payload.data.message.json;

    const logger = createLogger({
      logName: `httpHandler:${functionName || func.name || "unknownFunction"}`,
      shouldLogToConsole: getConfig().env === "local",
      labels: {
        ...logLabels,
        ...flattenObject({payload: rest}),
        correlationId,
      },
    });

    initializeAppAdmin();

    let validatedBody: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown;
    try {
      validatedBody = bodySchema.parse(rest);
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
        rest,
      });
      throw new BadRequestError("Invalid request body");
    }

    try {
      logger.debug("Running handler");
      const result = await asyncLocalStorage.run({logger}, async () => {
        return func(validatedBody);
      });
      logger.debug("Handler completed", {
        result,
      });
      return;
    } catch (e) {
      logger.error("Error in handler", {
        err: e,
        rest,
      });
      return;
    }
  });
}