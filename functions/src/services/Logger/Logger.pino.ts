import {Severity} from "@google-cloud/logging";
import {v4} from "uuid";
import {pino, LoggerOptions as PLoggerOptions, Logger as PLogger} from "pino";
import {Writable} from "stream";

import {
  Logger,
  LogFn,
  LoggerOptions,
  LogJson,
  LogLevel,
  logLevels,
} from "./Logger";
import {deepMerge} from "../../utils/object";

export function createPinoLogger(
  config: {
        shouldLogToConsole?: boolean;
        logLevel?: LogLevel;
        outStream?: Writable;
        logName?: string;
        bindings?: {
            parentLoggerName?: string;
            parentLoggerInstanceUuid?: string;
        } & Record<string, string | number | boolean>;
    } = {}
): PLogger<LogLevel> {
  const {
    shouldLogToConsole = false,
    logLevel = "debug",
    bindings = {},
    logName = "part3-logger",
  } = config;
  const {loggerInstanceUuid = v4()} = bindings;
  const loggingConfig: PLoggerOptions<LogLevel> = {
    level: logLevel,
    levelComparison: "DESC",
    customLevels: {
      debug: Severity.debug,
      info: Severity.info,
      notice: Severity.notice,
      warn: Severity.warning,
      warning: Severity.warning,
      error: Severity.error,
      critical: Severity.critical,
      alert: Severity.alert,
      emergency: Severity.emergency,
    },
    useOnlyCustomLevels: false,
    name: logName,
    messageKey: "message",
    formatters: {
      bindings(defaultBindings: Record<string, string>) {
        return Object.entries({
          loggerInstanceUuid,
          name: logName,
          ...defaultBindings,
          ...bindings,
        }).reduce((acc, [key, value]) => {
          acc[`_LOG_META_${key}`] = String(value);
          return acc;
        }, {} as Record<string, string>);
      },
      level(level: string | LogLevel): { severity: string; level: Severity } {
        if (level in logLevels) {
          return {
            severity: level.toUpperCase(),
            level: logLevels[level as LogLevel],
          };
        }
        return {
          severity: "INFO",
          level: logLevels.info,
        };
      },
      log(object: { labels?: string } & Record<string, unknown>) {
        const logObject = object as { err?: Error };
        const stackTrace = logObject.err?.stack;
        const stackProp = stackTrace ? {stack_trace: stackTrace} : {};

        const {labels = {}, ...rest} = object;

        return {
          ...rest,
          ...stackProp,
          "logging.googleapis.com/labels": labels,
        };
      },
    },
  };

  if (shouldLogToConsole) {
    console.log("createLogger: adding console transport");
    loggingConfig.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    };
  }

  const outStream = config.outStream || pino.destination(1);

  return pino(loggingConfig, outStream);
}

class PinoLogger extends Logger {
  private readonly config: LoggerOptions;
  private readonly pLogger: PLogger<LogLevel>;
  constructor();
  constructor(config: LoggerOptions);
  constructor(logger: PLogger<LogLevel>);
  constructor(logger: PLogger<LogLevel>, config: LoggerOptions);
  constructor(
    configOrLogger?: LoggerOptions | PLogger<LogLevel>,
    config?: LoggerOptions
  ) {
    super(config);
    if (!configOrLogger) {
      this.config = {};
      this.pLogger = createPinoLogger(this.config);
    } else if (isInstanceOfPinoLogger(configOrLogger)) {
      this.config = config || {};
      this.pLogger = configOrLogger;
    } else {
      this.config = configOrLogger;
      this.pLogger = createPinoLogger(this.config);
    }
  }

  child(optionOverrides: LoggerOptions = {}): Logger {
    const {
      _LOG_META_loggerInstanceUuid: parentLoggerInstanceUuid,
      _LOG_META_name: parentName,
    } = this.pLogger.bindings();

    const childLogName = optionOverrides.logName || `${parentName}_child`;

    const logMeta = {
      _LOG_META_parentLoggerName: parentName,
      _LOG_META_parentLoggerInstanceUuid: parentLoggerInstanceUuid,
      _LOG_META_name: childLogName,
      _LOG_META_loggerInstanceUuid: v4(),
    };
    const childLogger = this.pLogger.child(logMeta);
    return new PinoLogger(childLogger, deepMerge(this.config, optionOverrides));
  }

  debug: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["debug", ...args]);
  };
  info: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["info", ...args]);
  };
  notice: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["notice", ...args]);
  };
  warn: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["warn", ...args]);
  };
  warning: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["warning", ...args]);
  };
  error: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["error", ...args]);
  };
  critical: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["critical", ...args]);
  };
  alert: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["alert", ...args]);
  };
  emergency: LogFn = (...args: Parameters<LogFn>): ReturnType<LogFn> => {
    this.logAtLevel.apply(this, ["emergency", ...args]);
  };

  logAtLevel(level: LogLevel, ...args: Parameters<LogFn>) {
    const [messageDataOrError, maybeDataOrError] = args;
    const logFn = this.pLogger[level].bind(this.pLogger);
    let logPayload: LogJson = {
      labels: this.config.labels || {},
    };

    if (typeof messageDataOrError === "string") {
      logPayload["message"] = messageDataOrError;
      if (maybeDataOrError) {
        if (maybeDataOrError instanceof Error) {
          logPayload["err"] = maybeDataOrError;
        } else {
          logPayload = deepMerge(logPayload, maybeDataOrError);
        }
      }
      logFn(logPayload);
      return;
    } else {
      if (messageDataOrError instanceof Error) {
        logPayload["err"] = messageDataOrError;
      } else {
        logPayload = deepMerge(logPayload, messageDataOrError);
      }
      logFn(logPayload);
      return;
    }
  }
}

export function createLogger(options: LoggerOptions): Logger {
  return new PinoLogger(options);
}

function isInstanceOfPinoLogger(logger: unknown): logger is PLogger<LogLevel> {
  return (
    logger !== null &&
    typeof logger === "object" &&
      "bindings" in logger &&
      "debug" in logger &&
      true
  );
}
