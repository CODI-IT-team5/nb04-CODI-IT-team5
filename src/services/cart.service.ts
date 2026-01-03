// cart.service.ts
//import prisma from '../lib/prisma.js';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';
import * as cartRepository from '../repositories/cart.repository.js';
import { HttpException } from '../utils/http-exception.js';

export async function createCart(userId: string) {
  await cartRepository.getOrCreateCart(userId);

  // 항상 상세 구조로 다시 조회해서 반환
  const cart = await cartRepository.getCartWithItems(userId);
  return cart;
}

export async function patchCart(userId: string, input: PatchCartInput) {
  const { productId, sizes } = input;

  // 재고 체크: 수량이 0 이상인 모든 아이템 검증
  for (const sizeInfo of sizes) {
    const { sizeId, quantity } = sizeInfo;

    if (quantity > 0) {
      const stock = await cartRepository.getStockQuantity(productId, sizeId);

      if (!stock) {
        throw new HttpException({
          status: STATUS_CODE.BAD_REQUEST,
          message: `사이즈가 존재하지 않습니다.`,
        });
      }

      if (stock.quantity < quantity) {
        throw new HttpException({
          status: STATUS_CODE.BAD_REQUEST,
          message: MESSAGE.insufficientStock(sizeId, stock.quantity),
        });
      }
    }
  }

  const items = await cartRepository.upsertCartItems(userId, input);
  return items;
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const deletedCount = await cartRepository.deleteCartItem(userId, cartItemId);
  return deletedCount;
}
