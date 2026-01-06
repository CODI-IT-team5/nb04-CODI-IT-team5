import type { Image, Store } from '@prisma/client';

export class StoreResponse {
  static base(input: Store & { image: Image }) {
    return {
      id: input.id,
      name: input.name,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      userId: input.userId,
      address: input.address,
      detailAddress: input.detailAddress,
      phoneNumber: input.phoneNumber,
      content: input.content,
      image: input.image.url,
    };
  }

  static detail(input: Store & { favoriteCount: number } & { image: Image }) {
    return {
      id: input.id,
      name: input.name,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      userId: input.userId,
      address: input.address,
      detailAddress: input.detailAddress,
      phoneNumber: input.phoneNumber,
      content: input.content,
      image: input.image.url,
      favoriteCount: input.favoriteCount,
    };
  }

  static myDetail(
    input: Store & {
      productCount: number;
      favoriteCount: number;
      monthFavoriteCount: number;
      totalSoldCount: number;
    } & { image: Image },
  ) {
    return {
      id: input.id,
      name: input.name,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      userId: input.userId,
      address: input.address,
      detailAddress: input.detailAddress,
      phoneNumber: input.phoneNumber,
      content: input.content,
      image: input.image.url,
      productCount: input.productCount,
      favoriteCount: input.favoriteCount,
      monthFavoriteCount: input.monthFavoriteCount,
      totalSoldCount: input.totalSoldCount,
    };
  }
}
