import type { Size } from '@prisma/client';

import type { OrderWithDetails } from '../repositories/order.repository.js';

// 이제 OrderWithDetails 타입은 repository에서 가져오므로, 그에 맞춰 타입을 추론합니다.
type OrderItemWithDetails = OrderWithDetails['orderItems'][number];

export class OrderResponse {
  // private static으로 유틸리티 함수를 클래스 내부에 캡슐화
  private static transformSize(size: Size) {
    const sizeDetail = size.sizeDetail as { en?: string; ko?: string } | null;
    return {
      id: size.id, // Swagger에는 number로 되어있지만, 실제 DB id는 string
      size: sizeDetail || { en: size.name || '', ko: size.name || '' },
    };
  }

  private static transformOrderItem(item: OrderItemWithDetails) {
    return {
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      productId: item.productId,
      product: {
        name: item.product.name,
        image: item.product.image.url,
        reviews: item.product.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt,
        })),
      },
      size: this.transformSize(item.size),
      isReviewed: !!item.review, // review 객체의 존재 여부로 isReviewed 결정
    };
  }

  static single(order: OrderWithDetails) {
    return {
      id: order.id,
      name: order.name,
      phoneNumber: order.phoneNumber,
      address: order.address,
      subtotal: order.subtotal,
      totalQuantity: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      usePoint: order.usePoint,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(this.transformOrderItem.bind(this)),
      payments: order.payment, // payment -> payments
    };
  }

  static paginated(
    orders: OrderWithDetails[],
    meta: { total: number; page: number; limit: number; totalPages: number },
  ) {
    return {
      data: orders.map((order) => this.single(order)),
      meta: meta,
    };
  }
}
