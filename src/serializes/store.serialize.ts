import type { Store } from '@prisma/client';

export class StoreResponse {
  static base(input: Store) {
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
      image: input.image,
    };
  }

  static detail(input: Store & { favoriteCount: number }) {
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
      image: input.image,
      favoriteCount: input.favoriteCount,
    };
  }

  static myDetail(
    input: Store & {
      productCount: number;
      favoriteCount: number;
      monthFavoriteCount: number;
      totalSoldCount: number;
    },
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
      image: input.image,
      productCount: input.productCount,
      favoriteCount: input.favoriteCount,
      monthFavoriteCount: input.monthFavoriteCount,
      totalSoldCount: input.totalSoldCount,
    };
  }
}
