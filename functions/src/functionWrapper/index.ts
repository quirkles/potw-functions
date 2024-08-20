import {AsyncLocalStorage} from "async_hooks";

import {v4} from "uuid";

import {Logger} from "../services/Logger/Logger";

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
