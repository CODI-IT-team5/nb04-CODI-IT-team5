import type { Prisma } from '@prisma/client';

type SizeDetail = { ko?: string; en?: string; [key: string]: unknown };

const toSizeDetail = (value: Prisma.JsonValue | null): SizeDetail | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as SizeDetail;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CartItemWithDetails = any;

export class CartResponse {
  static transformCartItem(item: CartItemWithDetails) {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      sizeId: item.sizeId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: item.product
        ? {
            id: item.product.id,
            storeId: item.product.storeId,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image.url,
            createdAt: item.product.createdAt,
            updatedAt: item.product.updatedAt,
            reviewsRating: item.product.reviewsRating,
            categoryId: item.product.categoryId,
            content: item.product.content,
            isSoldOut: item.product.isSoldOut,
            discountRate: item.product.productDiscounts?.[0]?.discountRate ?? 0,
            discountStartTime: item.product.productDiscounts?.[0]?.discountStartTime ?? null,
            discountEndTime: item.product.productDiscounts?.[0]?.discountEndTime ?? null,
            store: item.product.store
              ? {
                  id: item.product.store.id,
                  userId: item.product.store.userId,
                  name: item.product.store.name,
                  address: item.product.store.address,
                  phoneNumber: item.product.store.phoneNumber,
                  content: item.product.store.content,
                  image: item.product.store.image.url,
                  createdAt: item.product.store.createdAt,
                  updatedAt: item.product.store.updatedAt,
                  detailAddress: item.product.store.detailAddress,
                }
              : null,
            stocks: item.product.stocks?.map(
              (s: {
                id: string;
                productId: string;
                sizeId: string;
                quantity: number;
                size: { id: string; name: string; sizeDetail: Prisma.JsonValue } | null;
              }) => ({
                id: s.id,
                productId: s.productId,
                sizeId: s.sizeId,
                quantity: s.quantity,
                size: s.size
                  ? {
                      id: s.size.id,
                      name: s.size.name,
                      size: toSizeDetail(s.size.sizeDetail),
                    }
                  : null,
              }),
            ),
          }
        : null,
      size: item.size
        ? {
            id: item.size.id,
            name: item.size.name,
            size: toSizeDetail(item.size.sizeDetail),
          }
        : null,
    };
  }

  static transformCartItemSimple(item: CartItemWithDetails) {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      sizeId: item.sizeId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: item.product
        ? {
            id: item.product.id,
            storeId: item.product.storeId,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image.url,
            createdAt: item.product.createdAt,
            updatedAt: item.product.updatedAt,
            discountRate: item.product.productDiscounts?.[0]?.discountRate ?? 0,
            discountStartTime: item.product.productDiscounts?.[0]?.discountStartTime ?? null,
            discountEndTime: item.product.productDiscounts?.[0]?.discountEndTime ?? null,
          }
        : null,
      cart: item.cart
        ? {
            id: item.cart.id,
            buyerId: item.cart.userId,
            createdAt: item.cart.createdAt,
            updatedAt: item.cart.updatedAt,
          }
        : null,
    };
  }
}
