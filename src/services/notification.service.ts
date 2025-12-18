import type { NotificationType } from '@prisma/client';
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
  // 접속중인 클라이언트들을 관리
  private clients: Map<string, Response> = new Map();

  /**
   * 새로운 클라이언트를 추가합니다.
   * @param userId - 사용자 ID
   * @param res - Express의 Response 객체
   */
  addClient(userId: string, res: Response): void {
    this.clients.set(userId, res);
    logger.info(`SSE: Client connected, userId: ${userId}. Total clients: ${this.clients.size}`);

    // 연결이 끊겼을 때 클라이언트 목록에서 제거
    res.on('close', () => {
      this.removeClient(userId);
      logger.info(`SSE: Client disconnected, userId: ${userId}. Total clients: ${this.clients.size}`);
    });
  }

  /**
   * 클라이언트를 목록에서 제거합니다.
   * @param userId - 사용자 ID
   */
  removeClient(userId: string): void {
    this.clients.delete(userId);
  }

  /**
   * DB에 알림을 생성하고, 실시간으로 클라이언트에게 전송합니다.
   * @param data - 생성할 알림 데이터
   */
  async createNotification(data: CreateNotificationInput) {
    // 1. DB에 알림 저장
    const savedNotification = await notificationRepository.create(data);
    
    // 2. 실시간으로 SSE 전송
    this.sendNotification(data.userId, savedNotification);
    
    // 3. 저장된 알림 데이터 반환
    return savedNotification;
  }

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
    // 1. 알림 존재 여부 확인
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw HttpException.notFound('알림을 찾을 수 없습니다.');
    }

    // 2. 알림의 주인이 맞는지 권한 확인
    if (notification.userId !== userId) {
      throw HttpException.forbidden('해당 알림을 읽을 권한이 없습니다.');
    }

    // 3. 읽음 처리 업데이트
    return notificationRepository.updateIsChecked(notificationId);
  }

  /**
   * 특정 사용자에게 알림을 보냅니다. (SSE 전송 전용)
   * @param userId - 알림을 받을 사용자 ID
   * @param data - 전송할 데이터 (객체 형태)
   */
  sendNotification(userId: string, data: unknown): void {
    const client = this.clients.get(userId);

    if (client) {
      try {
        // SSE 형식에 맞춰 데이터 전송: "data: { ...JSON... }\n\n"
        client.write(`data: ${JSON.stringify(data)}

`);
        logger.info(`SSE: Sent notification to userId: ${userId}, data: ${JSON.stringify(data)}`);
      } catch (error) {
        logger.error(error as Error, `SSE: Error sending notification to userId: ${userId}`);
        this.removeClient(userId);
      }
    } else {
      logger.warn(`SSE: Client not found for userId: ${userId}. Notification not sent.`);
    }
  }
}

// 싱글톤으로 인스턴스 생성
export const notificationService = new NotificationService();
