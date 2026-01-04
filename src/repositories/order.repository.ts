import type { Order, OrderStatus } from '@prisma/client';
import prisma from '../utils/prisma.js';

class OrderRepository {
  /**
   * 사용자의 주문 목록을 페이지네이션하여 조회합니다.
   */
  findManyByUserId = async (input: { userId: string; status?: OrderStatus; limit: number; page: number }) => {
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
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                reviews: true, // Swagger에 reviews가 포함되어 있음
                store: true,
              },
            },
            size: true,
            review: true, // isReviewed를 확인하기 위해 필요
          },
        },
        payment: true,
      },
    });
  };

  /**
   * 주문 목록의 총 개수를 조회합니다.
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
  findById = async (orderId: string) => {
    return prisma.order.findUnique({
      where: { id: orderId },
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
  };
}

export const orderRepository = new OrderRepository();
