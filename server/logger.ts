import { createLogger, format, transports } from "winston";
import path from "path";

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log')
    })
  ]
});

export function logAuthEvent(event: string, username: string, success: boolean, details?: string) {
  const message = `Auth Event: ${event} | User: ${username} | Success: ${success}${details ? ` | Details: ${details}` : ''}`;
  if (!success) {
    logger.error(message);
  } else {
    logger.info(message);
  }
}

export default logger;
