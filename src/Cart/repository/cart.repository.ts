// src/cart/cart.repository.ts
import prisma from '../lib/prisma.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';

export async function findCartByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
  });
}

export async function createCart(userId: string) {
  return prisma.cart.create({
    data: { userId },
  });
}

// 상세 조회용 (POST /api/cart 응답에 쓰기)
export async function getCartWithItems(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: true,
              stocks: {
                include: {
                  size: true,
                },
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

// PATCH /api/cart – 상품+여러 사이즈 한 번에 처리
export async function upsertCartItems(userId: string, input: PatchCartInput) {
  const { productId, sizes } = input;

  const cart = await getOrCreateCart(userId);

  // 사이즈별로 upsert / delete 처리
  for (const sizeInfo of sizes) {
    const { sizeId, quantity } = sizeInfo;

    if (quantity <= 0) {
      // 수량 0이면 해당 아이템 삭제
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
          sizeId,
        },
      });
      continue;
    }

    await prisma.cartItem.upsert({
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
    return null;
  }

  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartId: cart.id, // 내 카트에 속한 아이템만 삭제
    },
  });

  return prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: 'asc' },
  });
}
