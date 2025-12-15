import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';

import { config } from './config/config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { authRouter } from './routes/auth.router.js';
import { metadataRouter } from './routes/metadata.router.js';
import { s3Router } from './routes/s3.router.js';
import { userRouter } from './routes/user.router.js';
import logger from './utils/logger.js';
import { limiter } from './utils/rate-limit.js';

const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(loggerMiddleware); // 로그 저장

app.use(cors({ origin: config.app.cors_origin, credentials: config.app.cors_credentials })); // 요청 허용 도메인
app.use(compression({ threshold: config.app.compression_threshold, level: config.app.compression_level })); // 응답 압축
app.use(limiter); // API 요청 제한
app.use(helmet()); // 보안 헤더 적용

// 서버 상태 테스트용
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/s3', s3Router);
app.use('/api/metadata', metadataRouter);

// ----------------------------------------------------------
// sse 연결이 안 되면 프론트에서 무한 요청 보내서 임시로 만들어놓음.
// ----------------------------------------------------------
app.get('/api/notifications/sse', (req: Request, res: Response) => {
  req.on('close', () => {
    res.end();
  });
});
// ----------------------------------------------------------

app.use(errorMiddleware);

app.listen(config.app.port, () => {
  logger.info(`서버 이름: ${config.app.app_name}`);
  logger.info(`서버 실행 포트: ${config.app.port}`);
  logger.info(`환경: ${config.app.node_env}`);
  logger.info(`CORS 허용: ${config.app.cors_origin}`);
});
