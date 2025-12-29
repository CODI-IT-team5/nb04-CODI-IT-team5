import express from 'express';

import { notificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const notificationRouter = express.Router();

// SSE 연결
notificationRouter.get('/sse', authMiddleware, notificationController.subscribe);
// 내 알림 목록 조회
notificationRouter.get('/', authMiddleware, notificationController.getList);
// (테스트용) 알림 생성
notificationRouter.post('/', authMiddleware, notificationController.create);
// 알림 읽음 처리
notificationRouter.patch('/:alarmId/check', authMiddleware, notificationController.check);
