import winston from 'winston';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    isProduction ? winston.format.json() : winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} ${level}: ${message}${extra}`;
    })
  ),
  transports: [new winston.transports.Console()]
});
