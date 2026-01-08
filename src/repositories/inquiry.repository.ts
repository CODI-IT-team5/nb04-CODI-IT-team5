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

  async findByUserId(
    userId: string,
    options?: {
      page?: number;
      pageSize?: number;
      status?: InquiryStatus;
    },
  ): Promise<Inquiry[]> {
    const where = {
      userId,
      ...(options?.status ? { status: options.status } : {}),
    };

    const pagination =
      options?.page && options?.pageSize
        ? {
            skip: (options.page - 1) * options.pageSize,
            take: options.pageSize,
          }
        : {};

    return prisma.inquiry.findMany({
      where,
      include: {
        product: {
          include: {
            image: true,
            store: true,
          },
        },
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
      ...pagination,
    });
  }

  async countByUserId(
    userId: string,
    options?: {
      status?: InquiryStatus;
    },
  ): Promise<number> {
    const where = {
      userId,
      ...(options?.status ? { status: options.status } : {}),
    };

    return prisma.inquiry.count({
      where,
    });
  }

  async findByStoreId(
    storeId: string,
    options?: {
      page?: number;
      pageSize?: number;
      status?: InquiryStatus;
    },
  ): Promise<Inquiry[]> {
    const where = {
      product: {
        storeId,
      },
      ...(options?.status ? { status: options.status } : {}),
    };

    const pagination =
      options?.page && options?.pageSize
        ? {
            skip: (options.page - 1) * options.pageSize,
            take: options.pageSize,
          }
        : {};

    return prisma.inquiry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          include: {
            image: true,
            store: true,
          },
        },
        reply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...pagination,
    });
  }

  async countByStoreId(
    storeId: string,
    options?: {
      status?: InquiryStatus;
    },
  ): Promise<number> {
    const where = {
      product: {
        storeId,
      },
      ...(options?.status ? { status: options.status } : {}),
    };

    return prisma.inquiry.count({
      where,
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
