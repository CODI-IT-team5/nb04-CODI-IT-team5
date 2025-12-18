import { NotificationType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  content: string;
  url?: string;
};

class NotificationRepository {
  /**
   * 알림을 데이터베이스에 생성합니다.
   * @param data - 생성할 알림 데이터
   */
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        content: data.content,
        url: data.url ?? null,
      },
    });
  }

  /**
   * 특정 사용자의 모든 알림을 최신순으로 조회합니다.
   * @param userId - 사용자 ID
   */
  async findManyByUserId(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 특정 사용자의 읽지 않은 알림 개수를 조회합니다.
   * @param userId - 사용자 ID
   */
  async countUnchecked(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isChecked: false,
      },
    });
  }

  /**
   * ID로 특정 알림을 조회합니다.
   * @param id - 알림 ID
   */
  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * 특정 알림의 isChecked 상태를 true로 업데이트합니다.
   * @param id - 알림 ID
   */
  async updateIsChecked(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isChecked: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
