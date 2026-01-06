// src/cart/cart.repository.ts
import type { PatchCartInput } from '../dtos/cart.dto.js';
import prisma from '../utils/prisma.js';

export async function findCartByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
  });
}

// 제품의 특정 사이즈 재고 조회
export async function getStockQuantity(productId: string, sizeId: number) {
  const stock = await prisma.productStock.findUnique({
    where: {
      productId_sizeId: {
        productId,
        sizeId,
      },
    },
    select: {
      quantity: true,
      size: {
        select: {
          id: true,
          sizeDetail: true,
        },
      },
    },
  });

  return stock;
}

export async function createCart(userId: string) {
  return prisma.cart.create({
    data: { userId },
  });
}

// 상세 조회용 (GET /api/cart 응답에 쓰기) - Swagger 스펙 준수
export async function getCartWithItems(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              storeId: true,
              name: true,
              price: true,
              image: true,
              createdAt: true,
              updatedAt: true,
              reviewsRating: true,
              categoryId: true,
              content: true,
              isSoldOut: true,
              store: {
                select: {
                  id: true,
                  userId: true,
                  name: true,
                  address: true,
                  phoneNumber: true,
                  content: true,
                  image: true,
                  createdAt: true,
                  updatedAt: true,
                  detailAddress: true,
                },
              },
              stocks: {
                select: {
                  id: true,
                  productId: true,
                  sizeId: true,
                  quantity: true,
                  size: {
                    select: {
                      id: true,
                      name: true,
                      sizeDetail: true,
                    },
                  },
                },
              },
              productDiscounts: {
                where: {
                  revokedAt: null,
                  discountStartTime: { lte: new Date() },
                  discountEndTime: { gte: new Date() },
                },
                select: {
                  discountRate: true,
                  discountStartTime: true,
                  discountEndTime: true,
                },
                take: 1,
              },
            },
          },
          size: true,
        },
      },
    },
  });
  return cart;
}

// 장바구니 생성 or 기존 cart 반환
export async function getOrCreateCart(userId: string) {
  let cart = await findCartByUserId(userId);
  if (!cart) {
    cart = await createCart(userId);
  }
  return cart;
}

// PATCH /api/cart – 상품+여러 사이즈 한 번에 처리 (트랜잭션으로 원자성 보장)
export async function upsertCartItems(userId: string, input: PatchCartInput) {
  const { productId, sizes } = input;

  const cart = await getOrCreateCart(userId);

  // 트랜잭션으로 전체 작업 묶기: 하나라도 실패하면 전체 롤백
  await prisma.$transaction(async (tx) => {
    for (const sizeInfo of sizes) {
      const { sizeId, quantity } = sizeInfo;

      if (quantity <= 0) {
        // 수량 0이면 해당 아이템 삭제
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            productId,
            sizeId,
          },
        });
      } else {
        // 수량이 양수면 upsert
        await tx.cartItem.upsert({
          where: {
            cartId_productId_sizeId: {
              cartId: cart.id,
              productId,
              sizeId,
            },
          },
          update: {
            quantity,
          },
          create: {
            cartId: cart.id,
            productId,
            sizeId,
            quantity,
          },
        });
      }
    }
  });

  // 스펙상 PATCH 응답은 CartItem 배열 형식이라 생각하고 items만 반환
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: 'asc' },
  });

  return items;
}

// DELETE /api/cart/:cartItemId
export async function deleteCartItem(userId: string, cartItemId: string) {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    return 0;
  }

  const result = await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartId: cart.id, // 내 카트에 속한 아이템만 삭제
    },
  });

  return result.count;
}

// 단일 카트 아이템 상세 조회 (GET /api/cart/:cartItemId) - Swagger 스펙 준수 (간소화)
export async function getCartItemWithDetails(userId: string, cartItemId: string) {
  const cart = await findCartByUserId(userId);
  if (!cart) return null;

  return prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
    include: {
      product: {
        select: {
          id: true,
          storeId: true,
          name: true,
          price: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          productDiscounts: {
            where: {
              revokedAt: null,
              discountStartTime: { lte: new Date() },
              discountEndTime: { gte: new Date() },
            },
            select: {
              discountRate: true,
              discountStartTime: true,
              discountEndTime: true,
            },
            take: 1,
          },
        },
      },
      cart: true,
    },
  });
}
