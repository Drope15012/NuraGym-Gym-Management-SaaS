import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';

connectDB()
  .then(() => {
    const server = app.listen(env.PORT, () => {
      logger.info(`NuraGym API running on port ${env.PORT}`);
    });
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.PORT} is already in use. Stop the other process or set a different PORT in backend/.env.`);
      } else {
        logger.error('Backend server failed to start', { error: error.message });
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    logger.error(
      'MySQL connection failed. Check that MySQL is running and DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME are correct.',
      { error: error.message, code: error.code }
    );
    process.exit(1);
  });
