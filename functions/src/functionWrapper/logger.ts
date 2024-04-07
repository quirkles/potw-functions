import * as winston from "winston";

import {Severity} from "@google-cloud/logging";
import {LoggingWinston} from "@google-cloud/logging-winston";
import {getConfig} from "../config";

export type Logger = Omit<winston.Logger,
    "help" |
    "data" |
    "prompt" |
    "input" |
    "emerg" |
    "alert" |
    "crit"
> & {
    critical: winston.LeveledLogMethod;
    emergency: winston.LeveledLogMethod;
    alert: winston.LeveledLogMethod;
};

const logLevels = {
  debug: Severity.debug,
  info: Severity.info,
  notice: Severity.notice,
  warn: Severity.warning,
  warning: Severity.warning,
  error: Severity.error,
  critical: Severity.critical,
  alert: Severity.alert,
  emergency: Severity.emergency,
};

export function createLogger(logLabels: Record<string, string>): Logger {
  const config = getConfig();

  const loggingWinston = new LoggingWinston({
    labels: logLabels,
    levels: logLevels,
  });
  const transports: winston.transport[] = [
    // Add Cloud Logging
    loggingWinston,
  ];
  if (config.env === "local") {
    transports.push(
      new winston.transports.Console({}),
    );
  }
  return winston.createLogger({
    level: "debug",
    transports: transports,
    levels: logLevels,
  }) as unknown as Logger;
}
