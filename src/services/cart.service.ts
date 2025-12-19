// cart.service.ts
//import prisma from '../lib/prisma.js';
import * as cartRepository from '../repositories/cart.repository.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';

export async function createCart(userId: string) {
  await cartRepository.getOrCreateCart(userId);

  // 항상 상세 구조로 다시 조회해서 반환
  const cart = await cartRepository.getCartWithItems(userId);
  return cart;
}

export async function patchCart(userId: string, input: PatchCartInput) {
  const items = await cartRepository.upsertCartItems(userId, input);
  return items;
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const deletedCount = await cartRepository.deleteCartItem(userId, cartItemId);
  return deletedCount;
}
