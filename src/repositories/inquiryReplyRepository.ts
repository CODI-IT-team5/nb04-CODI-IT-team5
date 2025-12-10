import type { InquiryReply } from '@prisma/client';

import prisma from '../utils/prisma.js';

export interface CreateInquiryReplyData {
  content: string;
  inquiryId: string;
  userId: string;
}

export interface UpdateInquiryReplyData {
  content: string;
}

// 문의 답변 데이터 접근 계층
export class InquiryReplyRepository {
  async create(data: CreateInquiryReplyData): Promise<InquiryReply> {
    return prisma.inquiryReply.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        inquiry: true,
      },
    });
  }

  async findById(id: string): Promise<InquiryReply | null> {
    return prisma.inquiryReply.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        inquiry: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                storeId: true,
              },
            },
          },
        },
      },
    });
  }

  async findByInquiryId(inquiryId: string): Promise<InquiryReply | null> {
    return prisma.inquiryReply.findUnique({
      where: { inquiryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateInquiryReplyData): Promise<InquiryReply> {
    return prisma.inquiryReply.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        inquiry: true,
      },
    });
  }

  async delete(id: string): Promise<InquiryReply> {
    return prisma.inquiryReply.delete({
      where: { id },
    });
  }
}

export default new InquiryReplyRepository();
