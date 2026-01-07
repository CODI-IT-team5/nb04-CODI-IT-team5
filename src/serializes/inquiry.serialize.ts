import type { Image, Inquiry, InquiryReply, Product, Store, User } from '@prisma/client';

type InquiryWithRelations = Inquiry & {
  product: Product & {
    store: Store;
    image: Image;
  };
  user: Pick<User, 'id' | 'name'>;
  reply?: InquiryReply | null;
};

export type InquiryDetailWithRelations = Inquiry & {
  user?: Pick<User, 'id' | 'name' | 'email'> | null;
  product?:
    | (Product & {
        store?: Pick<Store, 'id' | 'name' | 'userId'> | null;
      })
    | null;
  reply?:
    | (InquiryReply & {
        user: Pick<User, 'id' | 'name'>;
      })
    | null;
};

export class InquiryResponse {
  // 내 문의 목록 아이템 응답
  static listItem(inquiry: InquiryWithRelations) {
    return {
      id: inquiry.id,
      title: inquiry.title,
      isSecret: inquiry.isSecret,
      status: inquiry.status,
      product: {
        id: inquiry.product.id,
        name: inquiry.product.name,
        image: inquiry.product.image.url,
        store: {
          id: inquiry.product.store.id,
          name: inquiry.product.store.name,
        },
      },
      user: {
        id: inquiry.user.id,
        name: inquiry.user.name,
      },
      createdAt: inquiry.createdAt,
      content: inquiry.content,
    };
  }

  // 내 문의 목록 응답 (페이지네이션 포함)
  static list(inquiries: InquiryWithRelations[], totalCount: number) {
    return {
      list: inquiries.map((inquiry) => InquiryResponse.listItem(inquiry)),
      totalCount,
    };
  }

  // 문의 상세 응답
  static detail(inquiry: InquiryDetailWithRelations) {
    return {
      id: inquiry.id,
      userId: inquiry.userId,
      productId: inquiry.productId,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      isSecret: inquiry.isSecret,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      reply: inquiry.reply
        ? {
            id: inquiry.reply.id,
            content: inquiry.reply.content,
            createdAt: inquiry.reply.createdAt,
            updatedAt: inquiry.reply.updatedAt,
            user: {
              id: inquiry.reply.user.id,
              name: inquiry.reply.user.name,
            },
          }
        : null,
    };
  }
}
