import fs from 'fs';
import path from 'path';
import pino from 'pino';

import { config } from '../config/config.js';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'app.log');

const logger = pino(
  {
    level: config.app.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  },

  pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
        level: 'debug',
      },
      {
        target: 'pino/file',
        options: { destination: logPath },
        level: 'info',
      },
    ],
  }),
);

export default logger;
