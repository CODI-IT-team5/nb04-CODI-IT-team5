import type { Review } from '@prisma/client';

import type { ReviewWithUser } from '../repositories/review.repository.js';

export class ReviewResponse {
  static base(input: Review) {
    return {
      id: input.id,
      userId: input.userId,
      productId: input.productId,
      orderItemId: input.orderItemId,
      rating: input.rating,
      content: input.content,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
  }

  static list(inputs: Review[]) {
    return inputs.map((input) => ({
      id: input.id,
      userId: input.userId,
      productId: input.productId,
      orderItemId: input.orderItemId,
      rating: input.rating,
      content: input.content,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    }));
  }

  static listWithUser(inputs: ReviewWithUser[]) {
    return inputs.map((input) => ({
      id: input.id,
      userId: input.userId,
      productId: input.productId,
      orderItemId: input.orderItemId,
      rating: input.rating,
      content: input.content,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      user: {
        id: input.user.id,
        name: input.user.name,
        image: input.user.image,
      },
    }));
  }

  static paginated(
    reviews: ReviewWithUser[],
    meta: { total: number; page: number; limit: number; hasNextPage: boolean },
  ) {
    return {
      items: this.listWithUser(reviews),
      meta,
    };
  }
}
