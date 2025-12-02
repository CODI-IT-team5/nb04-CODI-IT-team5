import type { NextFunction, Request, Response } from 'express';

import { MESSAGE } from '../constants/constant.js';
import type { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

export const errorMiddleware = (err: HttpException, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    status: err.status || 500,
    code: err.code, // 샌드버드 코드 포함
    message: err.message,
    body: req.body, // 요청 본문
    query: req.query, // 쿼리
    params: req.params, // URL params
    stack: err.stack || null, // 스택 트레이스
  });

  const status = err.status || 500;
  const message = status === 500 ? MESSAGE.serverError : err.message;

  res.status(status).json({
    code: err.code,
    message: message,
    path: req.originalUrl,
  });
};
