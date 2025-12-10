import type { Review } from '@prisma/client';

import prisma from '../utils/prisma.js';

export interface CreateReviewData {
  rating: number;
  content: string;
  userId: string;
  productId: string;
  orderItemId: string;
}

export interface UpdateReviewData {
  rating?: number;
  content?: string;
}

// 리뷰 데이터 접근 계층
export class ReviewRepository {
  async create(data: CreateReviewData): Promise<Review> {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            orderId: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            orderId: true,
          },
        },
      },
    });
  }

  async findByProductId(productId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            orderId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOrderItemId(orderItemId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { orderItemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateReviewData): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Review> {
    return prisma.review.delete({
      where: { id },
    });
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }

  async getReviewCount(productId: string): Promise<number> {
    return prisma.review.count({
      where: { productId },
    });
  }
}

export default new ReviewRepository();
