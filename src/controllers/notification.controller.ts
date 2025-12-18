import type { NextFunction, Request, Response } from 'express';
import { STATUS_CODE } from '../constants/constant.js';
import { notificationService } from '../services/notification.service.js';
import logger from '../utils/logger.js';

class NotificationController {
  /**
   * 클라이언트의 SSE 연결을 구독합니다.
   */
  subscribe = (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // SSE 필수 헤더 설정
      res.writeHead(STATUS_CODE.OK, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // 클라이언트를 서비스에 추가
      notificationService.addClient(userId, res);

      // 연결 초기화 메시지 (선택 사항)
      res.write(': connection established\n\n');
    } catch (error) {
      logger.error(error as Error, 'SSE connection error:');
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
