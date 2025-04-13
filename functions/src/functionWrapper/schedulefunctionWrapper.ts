import {ScheduleFunction, ScheduleOptions, onSchedule} from "firebase-functions/v2/scheduler";
import {v4} from "uuid";

import {createLogger} from "../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../services/firebase";

import {asyncLocalStorage, functionInstanceId} from "./index";


export function onScheduleHandler(
  func: () => Promise<void> | void,
  config: ScheduleOptions & {
    functionName?: string;
  },
): ScheduleFunction {
  return onSchedule(config, async () => {
    const logLabels: Record<string, string> = {
      requestId: v4(),
      functionInstanceId,
      functionExecutionId: v4(),
    };

    const correlationId = v4();

    const logger = createLogger({
      logName: `scheduleHandler:${config.functionName || func.name || "unknownFunction"}`,
      labels: {
        ...logLabels,
        correlationId,
      },
    });

    logger.info("Initializing admin app");

    initializeAppAdmin();

    try {
      logger.debug("Running handler");
      const result = await asyncLocalStorage.run({logger}, async () => {
        return func();
      });
      logger.debug("Handler completed", {
        result,
      });
    } catch (e) {
      logger.error("Error in handler", {
        err: e,
      });
      return;
    }
  });
}
