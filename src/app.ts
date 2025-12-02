import express from 'express';

import { appConfig } from './config/app.config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { authRouter } from './routes/auth.router.js';
import { userRouter } from './routes/user.router.js';
import logger from './utils/logger.js';

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

app.use(errorMiddleware);

app.listen(appConfig.port, () => {
  logger.info(`서버 이름: ${appConfig.app_name}`);
  logger.info(`서버 실행 포트: ${appConfig.port}`);
  logger.info(`환경: ${appConfig.node_env}`);
  logger.info(`CORS 허용: ${appConfig.cors_origin}`);
});
