import {Writable} from "stream";

import {Severity} from "@google-cloud/logging";

// The abstractions for the logger are defined here
// As long as createLogger returns an ILogger compliant class the callers wont know any different
// The implementation of the logger in its current state is in LoggerPino.ts
// Pino has been chosen because winston contains a memory leak, bunyan not be supported, pino the best of the rest.

// This is the data that is logged, it is a key-value pair object
// The labels will be merged with the labels initialized with the logger
// Log level labels will override logger level ones

export type LogJson = {
    labels?: Record<string, string | number | boolean>;
} & Record<string, unknown>;

type LogArgs =
    | [string]
    | [Error]
    | [LogJson]
    | [string, LogJson]
    | [string, Error];

export type LogFn = (...args: LogArgs) => void;

export const logLevels = {
  // These are the severity levels that are supported by google cloud logging
  debug: Severity.debug,
  info: Severity.info,
  notice: Severity.notice,
  warn: Severity.warning,
  warning: Severity.warning,
  error: Severity.error,
  critical: Severity.critical,
  alert: Severity.alert,
  emergency: Severity.emergency,
} as const;

export type LogLevel = keyof typeof logLevels;

type ILogger = {
    debug: LogFn;
    info: LogFn;
    notice: LogFn;
    warn: LogFn;
    warning: LogFn;
    error: LogFn;
    critical: LogFn;
    alert: LogFn;
    emergency: LogFn;
    child: (options?: LoggerOptions) => ILogger;
};

export abstract class Logger implements ILogger {
    abstract debug: LogFn;
    abstract info: LogFn;
    abstract notice: LogFn;
    abstract warn: LogFn;
    abstract warning: LogFn;
    abstract error: LogFn;
    abstract critical: LogFn;
    abstract alert: LogFn;
    abstract emergency: LogFn;
    abstract child(options?: LoggerOptions): Logger;
    protected constructor(protected options?: LoggerOptions) {
      return;
    }
}

// This is the implementation agnostic configuration for the logger
export interface LoggerOptions extends Record<string, unknown> {
    // This is slightly misnamed, if true it pretty-prints the logs to the console,
    // but different implementations may not always log to the console
    // Name is preserved to ensure backwards compatibility
    shouldLogToConsole?: boolean;
    // Labels to be added to every log entry
    labels?: Record<string, string | number | boolean>;
    // This is the log level that the logger will log at, logs below this level will be ignored
    logLevel?: LogLevel;
    // This is the name of the logger, it will be added to every log entry
    logName?: string;
    // This is the stream that the logger will write to, if not provided it will default to stdout
    // Useful for testing but also for piping logs to a file
    outStream?: Writable;
}
