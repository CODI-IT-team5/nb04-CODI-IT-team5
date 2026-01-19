// cart.service.ts
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';
import { cartRepository } from '../repositories/cart.repository.js';
import { HttpException } from '../utils/http-exception.js';

class CartService {
  async createCart(userId: string) {
    await cartRepository.getOrCreateCart(userId);

    // 항상 상세 구조로 다시 조회해서 반환
    const cart = await cartRepository.getCartWithItems(userId);
    return cart;
  }

  async patchCart(userId: string, input: PatchCartInput) {
    const { productId, sizes } = input;

    // 재고 체크: 수량이 0 이상인 모든 아이템 검증
    for (const sizeInfo of sizes) {
      const { sizeId, quantity } = sizeInfo;

      if (quantity > 0) {
        const stock = await cartRepository.getStockQuantity(productId, sizeId);

        if (!stock) {
          throw new HttpException({
            status: STATUS_CODE.BAD_REQUEST,
            message: MESSAGE.sizeNotFound,
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

  async removeCartItem(userId: string, cartItemId: string) {
    const deletedCount = await cartRepository.deleteCartItem(userId, cartItemId);
    return deletedCount;
  }

  async getCartWithItems(userId: string) {
    const cart = await cartRepository.getCartWithItems(userId);
    return cart;
  }

  async getCartItemWithDetails(userId: string, cartItemId: string) {
    const item = await cartRepository.getCartItemWithDetails(userId, cartItemId);
    return item;
  }
}

export const cartService = new CartService();
