import cors from 'cors';
import express from 'express';

import { config } from './config/config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { authRouter } from './routes/auth.router.js';
import { userRouter } from './routes/user.router.js';
import logger from './utils/logger.js';

const app = express();

app.use(express.json());
app.use(loggerMiddleware);
app.use(
  cors({
    origin: config.app.cors_origin,
    credentials: config.app.cors_credentials,
  }),
);

app.use('/auth', authRouter);
app.use('/users', userRouter);

app.use(errorMiddleware);

app.listen(config.app.port, () => {
  logger.info(`서버 이름: ${config.app.app_name}`);
  logger.info(`서버 실행 포트: ${config.app.port}`);
  logger.info(`환경: ${config.app.node_env}`);
  logger.info(`CORS 허용: ${config.app.cors_origin}`);

  logger.info(`CORS 허용: ${config.app.cors_credentials}`);
});
