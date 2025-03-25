import { createLogger, format, transports, Logger } from 'winston';

// Logger
const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.timestamp(), format.json())
    })
  ]
});

export default logger;
