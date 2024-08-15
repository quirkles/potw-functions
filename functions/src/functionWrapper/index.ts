import {AsyncLocalStorage} from "async_hooks";
import {Logger} from "../services/Logger/Logger";
import {v4} from "uuid";

export const functionInstanceId = v4();

export const asyncLocalStorage = new AsyncLocalStorage<{
    logger: Logger;
}>();

export function getLogger(): Logger {
  const logger = asyncLocalStorage.getStore()?.logger;
  if (!logger) {
    throw new Error("Logger not found in asyncLocalStorage");
  }
  return logger;
}
