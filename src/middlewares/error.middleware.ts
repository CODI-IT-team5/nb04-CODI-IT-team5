import type { NextFunction, Request, Response } from 'express';

import { MESSAGE } from '../constants/constant.js';
import type { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

export const errorMiddleware = (err: HttpException, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = status === 500 ? MESSAGE.serverError : err.message;

  // 프로젝트 루트 경로
  const projectRoot = process.cwd();

  // 스택 트레이스를 배열로 변환하고 절대 경로를 상대 경로로 변환
  const stackLines = err.stack
    ? err.stack.split('\n').map((line) => {
        // 절대 경로를 프로젝트 루트 기준 상대 경로로 변환
        return line.trim().replace(new RegExp(projectRoot, 'g'), '.');
      })
    : [];

  const logData = {
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    status,
    message: err.message,
    request: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    stack: stackLines,
  };

  // 5xx 에러(서버 에러)는 error 레벨, 4xx 에러(클라이언트 에러)는 warn 레벨로 로깅
  if (status >= 500) {
    logger.error(logData, `서버 에러 [${status}]`);
  } else {
    logger.warn(logData, `클라이언트 요청 에러 [${status}]`);
  }

  res.status(status).json({
    message: message,
    path: req.originalUrl,
  });
};
