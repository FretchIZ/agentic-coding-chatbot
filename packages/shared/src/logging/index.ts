export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
  enableExternal?: boolean;
  externalEndpoint?: string;
  externalApiKey?: string;
}

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
};

let loggerConfig: LoggerConfig = DEFAULT_CONFIG;

export const configureLogger = (config: Partial<LoggerConfig>): void => {
  loggerConfig = { ...loggerConfig, ...config };
};

const shouldLog = (level: LogLevel): boolean => {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
  return levels.indexOf(level) >= levels.indexOf(loggerConfig.minLevel);
};

const serializeError = (error: Error): LogEntry['error'] => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  ...(error instanceof Error && 'code' in error ? { code: (error as any).code } : {}),
});

const createLogEntry = (
  level: LogLevel,
  message: string,
  meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...meta,
});

const outputLog = (entry: LogEntry): void => {
  if (!shouldLog(entry.level)) return;

  const formatted = JSON.stringify(entry);

  if (!loggerConfig.enableConsole) return;

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(formatted);
      break;
  }
};

export const logger = {
  debug: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void => {
    outputLog(createLogEntry(LogLevel.DEBUG, message, meta));
  },

  info: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void => {
    outputLog(createLogEntry(LogLevel.INFO, message, meta));
  },

  warn: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void => {
    outputLog(createLogEntry(LogLevel.WARN, message, meta));
  },

  error: (message: string, error?: Error, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void => {
    outputLog(createLogEntry(LogLevel.ERROR, message, {
      ...meta,
      error: error ? serializeError(error) : undefined,
    }));
  },

  fatal: (message: string, error?: Error, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void => {
    outputLog(createLogEntry(LogLevel.FATAL, message, {
      ...meta,
      error: error ? serializeError(error) : undefined,
    }));
  },

  withModule: (module: string) => ({
    debug: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'module'>>) =>
      logger.debug(message, { ...meta, module }),
    info: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'module'>>) =>
      logger.info(message, { ...meta, module }),
    warn: (message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'module'>>) =>
      logger.warn(message, { ...meta, module }),
    error: (message: string, error?: Error, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'module'>>) =>
      logger.error(message, error, { ...meta, module }),
    fatal: (message: string, error?: Error, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'module'>>) =>
      logger.fatal(message, error, { ...meta, module }),
  }),
};