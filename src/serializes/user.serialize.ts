import type { likeStores, UserBase } from '../types/user.type.js';

export class UserResponse {
  static base(input: UserBase) {
    return {
      id: input.id,
      name: input.name,
      email: input.email,
      type: input.type,
      points: input.points,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      grade: {
        name: input.grade.name,
        id: input.grade.id,
        rate: input.grade.rate,
        minAmount: input.grade.minAmount,
      },
      image: input.image,
    };
  }

  static getLikeStores(inputs: likeStores[]) {
    return inputs.map((input) => ({
      storeId: input.storeId,
      userId: input.userId,
      store: {
        id: input.store.id,
        name: input.store.name,
        createdAt: input.store.createdAt,
        updatedAt: input.store.updatedAt,
        userId: input.store.userId,
        address: input.store.address,
        detailAddress: input.store.detailAddress,
        phoneNumber: input.store.phoneNumber,
        content: input.store.content,
        image: input.store.image,
      },
    }));
  }
}
