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

  static myProductItem(input: {
    id: string;
    image: Image;
    name: string;
    price: number;
    stock: number;
    isDiscount: boolean;
    createdAt: Date;
    isSoldOut: boolean;
  }) {
    return {
      id: input.id,
      image: input.image.url,
      name: input.name,
      price: input.price,
      stock: input.stock,
      isDiscount: input.isDiscount,
      createdAt: input.createdAt,
      isSoldOut: input.isSoldOut,
    };
  }

  static myProducts(input: {
    list: Array<{
      id: string;
      image: Image;
      name: string;
      price: number;
      stock: number;
      isDiscount: boolean;
      createdAt: Date;
      isSoldOut: boolean;
    }>;
    totalCount: number;
  }) {
    return {
      list: input.list.map((item) => StoreResponse.myProductItem(item)),
      totalCount: input.totalCount,
    };
  }
}
