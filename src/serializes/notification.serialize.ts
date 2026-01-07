import type { Notification } from '@prisma/client';

export class NotificationResponse {
  // 단일 알림 응답
  static item(notification: Notification) {
    return {
      id: notification.id,
      userId: notification.userId,
      content: notification.content,
      isChecked: notification.isChecked,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  // 알림 목록 응답 (GET /api/notifications)
  static list(notifications: Notification[]) {
    return {
      list: notifications.map((notification) => NotificationResponse.item(notification)),
      totalCount: notifications.length,
    };
  }
}
