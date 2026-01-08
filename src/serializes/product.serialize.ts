import type { ProductListItem, TransformedProduct } from '../types/product.type.js';

export class ProductResponse {
  // 상품 상세 응답 (GET /api/products/{id})
  static detail(product: TransformedProduct) {
    const activeDiscount = product.productDiscounts.find(
      (d) => !d.revokedAt && new Date(d.discountStartTime) <= new Date() && new Date(d.discountEndTime) >= new Date(),
    );

    const discountPrice = activeDiscount ? Math.floor(product.price * (1 - activeDiscount.discountRate / 100)) : null;

    return {
      id: product.id,
      name: product.name,
      image: product.image.url,
      content: product.content,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      reviewsRating: product.reviewsRating,
      storeId: product.storeId,
      storeName: product.store.name,
      price: product.price,
      discountPrice,
      discountRate: activeDiscount?.discountRate ?? null,
      discountStartTime: activeDiscount?.discountStartTime ?? null,
      discountEndTime: activeDiscount?.discountEndTime ?? null,
      reviewsCount: product.reviewsCount,
      reviews: {
        rate1Length: product.reviews.rate1Length,
        rate2Length: product.reviews.rate2Length,
        rate3Length: product.reviews.rate3Length,
        rate4Length: product.reviews.rate4Length,
        rate5Length: product.reviews.rate5Length,
        sumScore: product.reviews.sumScore,
      },
      inquiries: product.inquiries,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : null,
      stocks: product.stocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        size: {
          id: stock.size.id,
          name: stock.size.name,
        },
      })),
    };
  }

  // 상품 목록 아이템 응답 (GET /api/products)
  static listItem(item: ProductListItem) {
    return {
      id: item.id,
      storeId: item.storeId,
      storeName: item.storeName,
      name: item.name,
      image: item.image.url,
      price: item.price,
      discountPrice: item.discountPrice,
      discountRate: item.discountRate,
      discountStartTime: item.discountStartTime,
      discountEndTime: item.discountEndTime,
      reviewsCount: item.reviewsCount,
      reviewsRating: item.reviewsRating,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      sales: item.sales,
      isSoldOut: item.isSoldOut,
    };
  }

  // 페이지네이션 포함 목록 응답
  static list(items: ProductListItem[], totalCount: number) {
    return {
      list: items.map((item) => ProductResponse.listItem(item)),
      totalCount,
    };
  }
}
