import type { Order, OrderItem, Payment, Product, Review, Size, Store } from '@prisma/client';

// Prisma의 include로 가져온 복잡한 타입을 위한 인터페이스 정의
type OrderItemWithDetails = OrderItem & {
  product: Product & {
    reviews: Review[];
    store: Store;
  };
  size: Size;
  review: Review | null;
};

type OrderWithDetails = Order & {
  orderItems: OrderItemWithDetails[];
  payment: Payment | null;
};

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
        image: item.product.image,
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

  static paginated(orders: OrderWithDetails[], meta: { total: number; page: number; limit: number; totalPages: number }) {
    return {
      data: orders.map((order) => this.single(order)),
      meta: meta,
    };
  }
}
