export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
export class ConsoleLogger {
    source;
    constructor(source) {
        this.source = source;
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    error(message, data) {
        this.log(LogLevel.ERROR, message, data);
    }
    log(level, message, data) {
        const entry = { level, message, source: this.source, timestamp: new Date(), data };
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
export function createLogger(source) {
    return new ConsoleLogger(source);
}
//# sourceMappingURL=index.js.map