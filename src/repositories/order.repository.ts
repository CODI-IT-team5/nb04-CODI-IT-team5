import { OrderStatus, Prisma } from '@prisma/client';

import prisma from '../utils/prisma.js';

// Prisma.validator를 사용해 include를 포함한 타입을 정의하고 export
const orderWithDetailsValidator = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: {
    orderItems: {
      include: {
        product: {
          include: {
            reviews: true,
            store: true,
          },
        },
        size: true,
        review: true,
      },
    },
    payment: true,
  },
});

export type OrderWithDetails = Prisma.OrderGetPayload<typeof orderWithDetailsValidator>;

class OrderRepository {
  /**
   * 사용자의 주문 목록을 페이지네이션하여 조회합니다.
   */
  findManyByUserId = async (input: {
    userId: string;
    status?: OrderStatus;
    limit: number;
    page: number;
  }): Promise<OrderWithDetails[]> => {
    const { userId, status, limit, page } = input;
    const take = limit;
    const skip = (page - 1) * take;

    const where = {
      userId,
      ...(status && { status }),
    };

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      ...orderWithDetailsValidator, // include 구문을 재사용
    });
  };

  /**
   * 주문 목록의 총 개수를 조회합니다. 동기적으로 처리됩니다.
   */
  countByUserId = async (userId: string, status?: OrderStatus) => {
    return prisma.order.count({
      where: {
        userId,
        ...(status && { status }),
      },
    });
  };

  /**
   * 특정 주문을 상세 조회합니다.
   */
  findById = async (orderId: string): Promise<OrderWithDetails | null> => {
    return prisma.order.findUnique({
      where: { id: orderId },
      ...orderWithDetailsValidator, // include 구문을 재사용
    });
  };
}

export const orderRepository = new OrderRepository();
