import { NotificationType } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import { notificationService } from '../services/notification.service.js';
import { HttpException } from '../utils/http-exception.js';
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

  /**
   * 로그인한 유저의 알림 목록을 조회합니다.
   */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const notifications = await notificationService.getNotifications(userId);
      res.status(STATUS_CODE.OK).json(notifications);
    } catch (error) {
      next(error);
    }
  };

  /**
   * (테스트용) 알림을 생성합니다.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, type, content, url } = req.body;

      // NotificationType Enum에 해당 type이 존재하는지 검사
      if (!Object.values(NotificationType).includes(type)) {
        throw HttpException.badRequest('유효하지 않은 알림 타입입니다.');
      }

      const notification = await notificationService.createNotification({
        userId,
        type,
        content,
        url,
      });
      res.status(STATUS_CODE.CREATED).json(notification);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 특정 알림을 읽음 처리합니다.
   */
  check = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alarmId } = req.params;
      const userId = req.user!.id;

      const updatedNotification = await notificationService.readNotification(userId, alarmId as string);

      res.status(STATUS_CODE.OK).json(updatedNotification);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
