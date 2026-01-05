import type { Notification, NotificationType } from '@prisma/client';
import type { Response } from 'express';

import { notificationRepository } from '../repositories/notification.repository.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  content: string;
  url?: string;
};

class NotificationService {
  // 한 유저가 여러 기기에서 접속할 수 있도록, Response 객체를 배열로 관리합니다.
  private clients: Map<string, Response[]> = new Map();
  // 클라이언트별 알림 대기열
  private notificationsQueue: Map<string, Notification[]> = new Map();
  // 동시 접속 허용 수
  private readonly MAX_CONNECTIONS = 3;

  constructor() {
    // 30초마다 버퍼링된 알림을 전송
    setInterval(this.sendBufferedNotifications, 30000);
  }

  /**
   * 새로운 클라이언트를 추가하고, 알림 대기열을 초기화합니다.
   * @param userId - 사용자 ID
   * @param res - Express의 Response 객체
   */
  addClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId) || [];

    // 최대 연결 수 (3개) 초과 시 가장 오래된 연결을 종료하고 제거
    if (userClients.length >= this.MAX_CONNECTIONS) {
      const oldestClient = userClients.shift(); // 배열의 첫 번째 요소(가장 오래된 연결)를 제거
      if (oldestClient) {
        oldestClient.end();
        logger.info(`SSE: Max connections reached for userId: ${userId}. Closing the oldest connection.`);
      }
    }

    userClients.push(res);
    this.clients.set(userId, userClients);

    // 새 클라이언트를 위한 알림 대기열 초기화
    if (!this.notificationsQueue.has(userId)) {
      this.notificationsQueue.set(userId, []);
    }

    logger.info(`SSE: Client connected, userId: ${userId}. Total connections for user: ${userClients.length}`);

    // 연결이 끊겼을 때 해당 클라이언트만 목록에서 제거
    res.on('close', () => {
      this.removeClient(userId, res);
      const conns = this.clients.get(userId)?.length || 0;
      logger.info(`SSE: Client disconnected, userId: ${userId}. Remaining connections: ${conns}`);
    });
  }

  /**
   * 특정 클라이언트를 목록에서 제거하고, 연결이 없으면 대기열도 삭제합니다.
   * @param userId - 사용자 ID
   * @param resToRemove - 제거할 Express의 Response 객체
   */
  removeClient(userId: string, resToRemove: Response): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    // 제거할 res 객체를 제외한 새 배열을 생성
    const filteredClients = userClients.filter((client) => client !== resToRemove);

    if (filteredClients.length > 0) {
      this.clients.set(userId, filteredClients);
    } else {
      // 해당 유저의 연결이 하나도 남지 않으면 Map에서 키를 삭제
      this.clients.delete(userId);
      // 대기열도 함께 삭제
      this.notificationsQueue.delete(userId);
    }
  }

  /**
   * DB에 알림을 생성하고, 대기열에 추가합니다.
   * @param data - 생성할 알림 데이터
   */
  async createNotification(data: CreateNotificationInput) {
    const savedNotification = await notificationRepository.create(data);

    // 해당 유저가 접속 중인지 확인
    if (this.clients.has(data.userId)) {
      const queue = this.notificationsQueue.get(data.userId) || [];
      queue.push(savedNotification);
      this.notificationsQueue.set(data.userId, queue);
      logger.info(`SSE: Queued notification for userId: ${data.userId}. Queue size: ${queue.length}`);
    }

    return savedNotification;
  }

  /**
   * 30초 주기로 대기열의 알림을 클라이언트에게 보냅니다.
   * 대기열이 비어있으면 빈 배열을 보냅니다.
   */
  private sendBufferedNotifications = (): void => {
    this.clients.forEach((_, userId) => {
      const queue = this.notificationsQueue.get(userId) || [];
      this.sendNotification(userId, queue);
      // 전송 후 대기열 비우기
      this.notificationsQueue.set(userId, []);

      if (queue.length > 0) {
        logger.info(`SSE: Flushed notification queue for userId: ${userId}. Sent ${queue.length} items.`);
      }
    });
  };

  /**
   * 특정 유저의 알림 목록을 조회합니다.
   * @param userId - 사용자 ID
   */
  async getNotifications(userId: string) {
    return notificationRepository.findManyByUserId(userId);
  }

  /**
   * 특정 알림을 읽음 처리합니다.
   * @param userId - 요청한 사용자 ID
   * @param notificationId - 읽음 처리할 알림 ID
   */
  async readNotification(userId: string, notificationId: string) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw HttpException.notFound('알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw HttpException.forbidden('해당 알림을 읽을 권한이 없습니다.');
    }

    return notificationRepository.updateIsChecked(notificationId);
  }

  /**
   * 특정 사용자에게 알림을 보냅니다. (SSE 전송 전용)
   * 해당 유저의 모든 연결된 기기에 알림을 전송합니다.
   * @param userId - 알림을 받을 사용자 ID
   * @param data - 전송할 데이터 (객체 또는 배열)
   */
  sendNotification(userId: string, data: unknown): void {
    const userClients = this.clients.get(userId);

    if (userClients && userClients.length > 0) {
      const message = `data: ${JSON.stringify(data)}\n\n`;

      // 해당 유저의 모든 클라이언트에게 알림 전송
      userClients.forEach((client) => {
        try {
          client.write(message);
        } catch (error) {
          logger.error(error as Error, `SSE: Error sending notification to userId: ${userId}`);
          // 오류 발생 시 해당 클라이언트만 제거
          this.removeClient(userId, client);
        }
      });

      // 데이터가 있을 때만 전송 로그를 남김
      if (Array.isArray(data) && data.length > 0) {
        logger.info(`SSE: Sent notification to userId: ${userId} (${userClients.length} clients)`);
      }
    }
  }
}

// 싱글톤으로 인스턴스 생성
export const notificationService = new NotificationService();
