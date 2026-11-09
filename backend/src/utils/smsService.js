import { logger } from '../config/logger.js';

export async function sendSms({ to, message }) {
  logger.info('SMS queued', { to, preview: message?.slice(0, 80) });
  return { queued: true };
}
