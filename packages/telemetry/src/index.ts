export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  source?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private source?: string) {}

  debug(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = { level, message, source: this.source, timestamp: new Date(), data };
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}]${this.source ? ` [${this.source}]` : ''}`;
    const output = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}

export function createLogger(source?: string): Logger {
  return new ConsoleLogger(source);
}
