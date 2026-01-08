import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { HttpException } from '../utils/http-exception.js';
import { logger } from '../utils/logger.js';

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

  // 에러 이름 결정 (자동 변환 로직 사용)
  const errorName = getErrorName(status);

  // 프로젝트 루트 경로
  const projectRoot = process.cwd();

  // 스택 트레이스를 배열로 변환하고 절대 경로를 상대 경로로 변환
  const stackLines = err.stack
    ? err.stack.split('\n').map((line) => {
        // 절대 경로를 프로젝트 루트 기준 상대 경로로 변환
        return line.trim().replace(new RegExp(projectRoot, 'g'), '.');
      })
    : [];
  // 로깅
  const logData = {
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    status,
    message, // 사용자에게 나가는 메시지
    request: {
      body: req.body, // 요청 본문
      query: req.query, // 쿼리 스트링
      params: req.params, // URL 파라미터
    },
    stack: stackLines, // 디버깅용 스택 트레이스
  };

  // 5xx 에러(서버 에러)는 error 레벨, 4xx 에러(클라이언트 에러)는 warn 레벨로 로깅
  if (status >= 500) {
    logger.error(logData, `서버 에러 [${status}]`);
  } else {
    logger.warn(logData, `클라이언트 요청 에러 [${status}]`);
  }

  // 응답 전송 (Swagger 규격 준수)
  res.status(status).json({
    message: message,
    statusCode: status,
    error: errorName,
  });
};

// [보조 함수] 상태 코드로 에러 이름 자동 생성
// 예: 400 -> 'BAD_REQUEST' 찾음 -> 'Bad Request'로 변환
function getErrorName(status: number): string {
  // 1. STATUS_CODE 객체에서 value(숫자)가 status와 일치하는 key를 찾습니다.
  const key = Object.keys(STATUS_CODE).find((k) => STATUS_CODE[k as keyof typeof STATUS_CODE] === status);

  // 2. 키를 못 찾으면 기본값 반환
  if (!key) {
    return 'Error';
  }

  // 3. 변환 로직: "BAD_REQUEST" -> "Bad Request"
  return key
    .split('_') // ['BAD', 'REQUEST'] 로 분리
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // ['Bad', 'Request'] 로 변환
    .join(' '); // "Bad Request" 로 합침
}
