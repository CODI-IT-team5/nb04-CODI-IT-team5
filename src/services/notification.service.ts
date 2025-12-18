import type { Response } from 'express';
import logger from '../utils/logger.js';

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
   * 특정 사용자에게 알림을 보냅니다.
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
