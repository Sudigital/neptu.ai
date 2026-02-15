import pino from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
}

const baseConfig = {
  level: process.env.LOG_LEVEL || "info",
};

const devTransport = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "HH:MM:ss Z",
    ignore: "pid,hostname",
  },
};

const loggerConfig =
  process.env.NODE_ENV !== "production"
    ? { ...baseConfig, transport: devTransport }
    : baseConfig;

export type Logger = ReturnType<typeof pino>;

// Default logger instance
export const logger = pino(loggerConfig);

// Factory function
export function createLogger(options: LoggerOptions = {}): Logger {
  const config = {
    ...loggerConfig,
    name: options.name,
    level: options.level ?? loggerConfig.level,
  };
  return pino(config);
}

// Re-export pino types
export { pino };
