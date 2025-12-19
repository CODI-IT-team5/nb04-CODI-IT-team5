// src/cart/cart.controller.ts

import type { Request, Response, NextFunction } from 'express';
import * as cartService from '../services/cart.service.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';
import { getCartWithItems, getCartItemWithDetails } from '../repositories/cart.repository.js';

// 공통 401 응답 헬퍼 (선택이지만 편해서 추가)
function getUserIdOr401(req: Request, res: Response): string | null {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      statusCode: 401,
      message: '인증이 필요합니다.',
      error: 'Unauthorized',
    });
    return null;
  }
  return user.id;
}

// POST /api/cart : 장바구니 생성 (또는 기존 카트 반환)
export async function createCart(req: Request, res: Response) {
  const userId = getUserIdOr401(req, res);
  if (!userId) return; // 위에서 401 응답 후 종료

  const cart = await cartService.createCart(userId);
  if (!cart) {
    return res.status(500).json({
      statusCode: 500,
      message: '장바구니 생성에 실패했습니다.',
    });
  }

  // 총 quantity 계산 (items의 quantity 합)
  const totalQuantity = cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

  return res.status(201).json({
    id: cart.id,
    buyerId: cart.userId,
    quantity: totalQuantity,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => ({
      ...item,
      // sizeDetail를 스펙의 size로 매핑
      size: item.size
        ? { id: item.size.id, size: (item.size as any).sizeDetail ?? null }
        : item.size,
      product: item.product
        ? {
            ...item.product,
            // 현재 유효한 할인 하나를 평탄화
            discountRate: item.product.productDiscounts?.[0]?.discountRate ?? 0,
            discountStartTime: item.product.productDiscounts?.[0]?.discountStartTime ?? null,
            discountEndTime: item.product.productDiscounts?.[0]?.discountEndTime ?? null,
            // stocks의 sizeDetail도 매핑
            stocks: item.product.stocks?.map((s: any) => ({
              ...s,
              size: s.size?.sizeDetail ?? null,
            })),
          }
        : item.product,
    })),
  });
}

// PATCH /api/cart : 장바구니 수정 (아이템 추가/수정)
export async function patchCart(req: Request, res: Response) {
  const userId = getUserIdOr401(req, res);
  if (!userId) return;

  const body = req.body as PatchCartInput;

  const items = await cartService.patchCart(userId, body);

  return res.status(200).json(items);
}

// DELETE /api/cart/:cartItemId : 장바구니 아이템 삭제
export async function deleteCartItem(req: Request, res: Response) {
  const userId = getUserIdOr401(req, res);
  if (!userId) return;

  const cartItemId = req.params.cartItemId; // 타입: string
  // 혹시나 모를 빈 값에 대한 방어
  if (!cartItemId) {
    return res.status(400).json({
      statusCode: 400,
      message: '잘못된 요청입니다.',
      error: 'Bad Request',
    });
  }

  const deletedCount = await cartService.removeCartItem(userId, cartItemId);
  if (!deletedCount) {
    return res.status(404).json({
      statusCode: 404,
      message: '장바구니에 아이템이 없습니다.',
      error: 'Not Found',
    });
  }

  // 스펙상 204 No Content
  return res.status(204).send();
}

// GET /api/cart : 장바구니 조회
export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const cart = await getCartWithItems(userId);

    // 장바구니가 없거나 아이템이 없으면 404
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: '장바구니에 아이템이 없습니다.',
        error: 'Not Found',
      });
    }

    // quantity = 아이템 수량 합
    const totalQuantity = cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

    // Swagger 스펙 맞춰 quantity 필드만 추가해서 응답
    return res.status(200).json({
      id: cart.id,
      buyerId: cart.userId, // DB 필드 userId → 응답은 buyerId로 매핑
      quantity: totalQuantity,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => ({
        ...item,
        size: item.size
          ? { id: item.size.id, size: (item.size as any).sizeDetail ?? null }
          : item.size,
        product: item.product
          ? {
              ...item.product,
              discountRate: item.product.productDiscounts?.[0]?.discountRate ?? 0,
              discountStartTime: item.product.productDiscounts?.[0]?.discountStartTime ?? null,
              discountEndTime: item.product.productDiscounts?.[0]?.discountEndTime ?? null,
              stocks: item.product.stocks?.map((s: any) => ({
                ...s,
                size: s.size?.sizeDetail ?? null,
              })),
            }
          : item.product,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/cart/:cartItemId : 장바구니 아이템 상세 조회
export async function getCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const { cartItemId } = req.params;
    if (!cartItemId) {
      return res.status(400).json({
        statusCode: 400,
        message: '잘못된 요청입니다.',
        error: 'Bad Request',
      });
    }

    const item = await getCartItemWithDetails(userId, cartItemId);
    if (!item) {
      return res.status(404).json({
        statusCode: 404,
        message: '장바구니에 아이템이 없습니다.',
        error: 'Not Found',
      });
    }

    const transformed = {
      ...item,
      size: item.size ? { id: item.size.id, size: (item.size as any).sizeDetail ?? null } : item.size,
      product: item.product
        ? {
            ...item.product,
            discountRate: item.product.productDiscounts?.[0]?.discountRate ?? 0,
            discountStartTime: item.product.productDiscounts?.[0]?.discountStartTime ?? null,
            discountEndTime: item.product.productDiscounts?.[0]?.discountEndTime ?? null,
            stocks: item.product.stocks?.map((s: any) => ({
              ...s,
              size: s.size?.sizeDetail ?? null,
            })),
          }
        : item.product,
      cart: item.cart
        ? {
            id: item.cart.id,
            buyerId: item.cart.userId,
            quantity: item.cart.items?.reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0) ?? 0,
            createdAt: item.cart.createdAt,
            updatedAt: item.cart.updatedAt,
          }
        : item.cart,
    };

    return res.status(200).json(transformed);
  } catch (error) {
    next(error);
  }
}
