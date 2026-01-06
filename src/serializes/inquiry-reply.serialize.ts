import type { Inquiry, InquiryReply, User } from '@prisma/client';

export type InquiryReplyWithRelations = InquiryReply & {
  user?: Pick<User, 'id' | 'name'> | null;
  inquiry?: Inquiry | null;
};

export class InquiryReplyResponse {
  // 답변 등록/수정 응답
  static detail(reply: InquiryReplyWithRelations) {
    return {
      id: reply.id,
      inquiryId: reply.inquiryId,
      userId: reply.userId,
      content: reply.content,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };
  }
}
