import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config/config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { authRouter } from './routes/auth.router.js';
import { cartRouter } from './routes/cart.router.js';
import { dashboardRouter } from './routes/dashboard.router.js';
import { inquiryRouter } from './routes/inquiry.router.js';
import { metadataRouter } from './routes/metadata.router.js';
import { notificationRouter } from './routes/notification.router.js';
import { orderRouter } from './routes/order.router.js';
import { productRouter } from './routes/product.router.js';
import { productReviewRouter } from './routes/product-review.router.js';
import { reviewRouter } from './routes/review.router.js';
import { s3Router } from './routes/s3.router.js';
import { storeRouter } from './routes/store.router.js';
import { userRouter } from './routes/user.router.js';
import { HttpException } from './utils/http-exception.js';
import { logger } from './utils/logger.js';
import { limiter } from './utils/rate-limit.js';

const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(loggerMiddleware); // 로그 저장

app.set('etag', false); // TODO: 프론트에서 304 받으면 에러나서 임시 설정

app.use(
  cors({
    origin: config.app.cors_origin,
    credentials: config.app.cors_credentials,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
); // 요청 허용 도메인

// SSE 경로는 compression 제외
app.use(
  compression({
    threshold: config.app.compression_threshold,
    level: config.app.compression_level,
    filter: (req, res) => {
      // SSE 엔드포인트는 압축 제외
      if (req.path === '/api/notifications/sse') {
        return false;
      }
      // 기본 compression filter 사용
      return compression.filter(req, res);
    },
  }),
); // 응답 압축
app.use(limiter); // API 요청 제한
app.use(helmet()); // 보안 헤더 적용

// 서버 상태 테스트용
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/s3', s3Router);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/stores', storeRouter);
app.use('/api/products', productRouter);
app.use('/api/product', productReviewRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/review', reviewRouter);
app.use('/api/inquiries', inquiryRouter);

app.use((req, res, next) => {
  // "경로를 찾을 수 없습니다"라는 404 에러를 강제로 발생시켜서 errorMiddleware로 넘김
  next(HttpException.notFound('잘못된 URL 입니다'));
});

app.use(errorMiddleware);

app.listen(config.app.port, () => {
  logger.info(`서버 이름: ${config.app.app_name}`);
  logger.info(`서버 실행 포트: ${config.app.port}`);
  logger.info(`환경: ${config.app.node_env}`);
  logger.info(`CORS 허용: ${config.app.cors_origin}`);
});
