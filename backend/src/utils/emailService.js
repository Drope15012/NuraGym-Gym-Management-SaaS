import { logger } from '../config/logger.js';

export async function sendEmail({ to, subject, text }) {
  logger.info('Email queued', { to, subject, preview: text?.slice(0, 80) });
  return { queued: true };
}
