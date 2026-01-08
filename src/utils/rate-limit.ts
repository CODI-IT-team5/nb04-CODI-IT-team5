import type { NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

import { config } from '../config/config.js';
import { MESSAGE } from '../constants/constant.js';
import { logger } from './logger.js';

export const limiter = rateLimit({
  windowMs: config.app.rateLimitWindowMs,
  max: config.app.rateLimitMax,
  handler: (req, res, _next: NextFunction) => {
    logger.warn({
      type: 'rate-limit',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(429).json({ message: MESSAGE.tooManyRequests, path: req.originalUrl });
  },
});
