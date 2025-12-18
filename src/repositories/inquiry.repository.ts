import type { Inquiry } from '@prisma/client';
import { InquiryStatus } from '@prisma/client';

import prisma from '../utils/prisma.js';

export interface CreateInquiryData {
  title: string;
  content: string;
  isSecret: boolean;
  userId: string;
  productId: string;
}

export interface UpdateInquiryData {
  title?: string;
  content?: string;
  isSecret?: boolean;
}

// 문의 데이터 접근 계층
export class InquiryRepository {
  async create(data: CreateInquiryData): Promise<Inquiry> {
    return prisma.inquiry.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            storeId: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Inquiry | null> {
    return prisma.inquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
          },
        },
        reply: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findByProductId(productId: string): Promise<Inquiry[]> {
    return prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string): Promise<Inquiry[]> {
    return prisma.inquiry.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            store: {
              select: {
                name: true,
              },
            },
          },
        },
        reply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByStoreId(storeId: string): Promise<Inquiry[]> {
    return prisma.inquiry.findMany({
      where: {
        product: {
          storeId,
        },
      },
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
        reply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: UpdateInquiryData): Promise<Inquiry> {
    return prisma.inquiry.update({
      where: { id },
      data,
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
        reply: true,
      },
    });
  }

  async delete(id: string): Promise<Inquiry> {
    return prisma.inquiry.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    return prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }
}

export default new InquiryRepository();
