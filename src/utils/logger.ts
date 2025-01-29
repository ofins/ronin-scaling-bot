import winston from "winston";
const lightBlueColorize = (text: string) => `\x1b[94m${text}\x1b[39m`; // Light blue ANSI escape code

export const createLogger = () => {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: () => new Date().toLocaleString() }),
      winston.format.printf(({ level, message, timestamp }) => {
        // Customize the log format to match "[info] | timestamp | message"
        return `[${level}] | ${lightBlueColorize(String(timestamp))} | ${
          typeof message === "object"
            ? JSON.stringify(message, null, 2)
            : message
        }`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => {
            // This printf will control the structure now
            return `[${level}] | ${lightBlueColorize(String(timestamp))} | ${
              typeof message === "object"
                ? JSON.stringify(message, null, 2)
                : message
            }`;
          })
        ),
      }),
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error", // Only log errors to this file
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }),
    ],
  });
};
