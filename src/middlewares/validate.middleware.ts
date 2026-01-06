import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { z } from 'zod';

import { STATUS_CODE } from '../constants/constant.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateMiddleware(schema: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.validated = {};

      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
        req.validated.body = req.body;
      }
      if (schema.query) {
        req.validated.query = (await schema.query.parseAsync(req.query)) as Record<string, unknown>;
      }
      if (schema.params) {
        req.validated.params = (await schema.params.parseAsync(req.params)) as Record<string, unknown>;
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.debug({
          message: 'Zod error',
          path: req.originalUrl,
          method: req.method,
          ip: req.ip,
          body: req.body,
          query: req.query,
          params: req.params,
          errors: err.issues,
        });

        const firstError = err.issues[0];

        let message = '유효하지 않은 요청 형식입니다';

        if (firstError) {
          if (firstError.code === 'unrecognized_keys') {
            message = `${firstError.keys.join('.')}: 허용되지 않은 필드입니다`;
          } else {
            message = `${firstError.path.join('.')}: ${firstError.message}`;
          }
        }
        next(new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: message }));
      } else {
        next(err);
      }
    }
  };
}
