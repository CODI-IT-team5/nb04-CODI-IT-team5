import type { NextFunction, Request, Response } from 'express';

import { ERROR_NAME, MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

interface ErrorWithStatus {
  status?: number;
  message?: string;
}

export const errorMiddleware = (err: Error | HttpException, req: Request, res: Response, _next: NextFunction) => {
  // 기본값 설정 (500 서버 에러)
  let status = STATUS_CODE.INTERNAL_SERVER_ERROR;
  let message = MESSAGE.serverError;

  if (err instanceof HttpException) {
    status = err.status;
    message = err.message;
  } else {
    const error = err as ErrorWithStatus;
    if (error.status) {
      status = error.status;
      // 메시지가 있으면 쓰고, 없으면 기존 서버 에러 메시지 유지
      message = error.message || message;
    }
  }

  // 에러 이름 결정 (Swagger용)
  const errorName = getErrorName(status);

  // 로깅
  logger.error({
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    status: status,
    message: message, // 사용자에게 나가는 메시지
    body: req.body, // 요청 본문
    query: req.query, // 쿼리 스트링
    params: req.params, // URL 파라미터
    stack: err.stack || null, // 디버깅용 스택 트레이스
  });

  // 응답 전송 (Swagger 규격 준수)
  res.status(status).json({
    message: message,
    statusCode: status,
    error: errorName,
  });
};

// [보조 함수]
function getErrorName(status: number): string {
  switch (status) {
    case STATUS_CODE.BAD_REQUEST:
      return ERROR_NAME.BAD_REQUEST;
    case STATUS_CODE.UNAUTHORIZED:
      return ERROR_NAME.UNAUTHORIZED;
    case STATUS_CODE.FORBIDDEN:
      return ERROR_NAME.FORBIDDEN;
    case STATUS_CODE.NOT_FOUND:
      return ERROR_NAME.NOT_FOUND;
    case STATUS_CODE.CONFLICT:
      return ERROR_NAME.CONFLICT;
    case STATUS_CODE.INTERNAL_SERVER_ERROR:
      return ERROR_NAME.INTERNAL_SERVER_ERROR;
    default:
      return 'Error';
  }
}
