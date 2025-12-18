import express from 'express';

import { notificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const notificationRouter = express.Router();

// GET /api/notifications/sse
// 로그인한 사용자만 SSE 연결을 생성할 수 있도록 authMiddleware 적용
notificationRouter.get('/sse', authMiddleware, notificationController.subscribe);

import { notificationService } from '../services/notification.service.js';

notificationRouter.post('/test', (req, res) => {
  const { userId, message } = req.body;

  // 서비스의 발송 메서드 강제 호출
  notificationService.sendNotification(userId, {
    type: 'TEST',
    content: message,
    createdAt: new Date(),
  });

  res.send('알림 발송 시도 완료');
});
