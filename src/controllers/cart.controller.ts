// src/cart/cart.controller.ts

import type { NextFunction, Request, Response } from 'express';
import type { Prisma } from '@prisma/client';

import { STATUS_CODE } from '../constants/constant.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';
import { getCartItemWithDetails, getCartWithItems } from '../repositories/cart.repository.js';
import * as cartService from '../services/cart.service.js';
import { HttpException } from '../utils/http-exception.js';

type SizeDetail = { ko?: string; en?: string; [key: string]: unknown };

const toSizeDetail = (value: Prisma.JsonValue | null): SizeDetail | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as SizeDetail;
};

class CartController {
  private getUserIdOr401(req: Request, res: Response, next: NextFunction): string {
    const user = req.user;
    if (!user) {
      throw HttpException.unauthorized('인증이 필요합니다.');
    }
    return user.id;
  }

  private transformCartItem(item: any) {
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
            image: item.product.image,
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
                  image: item.product.store.image,
                  createdAt: item.product.store.createdAt,
                  updatedAt: item.product.store.updatedAt,
                  detailAddress: item.product.store.detailAddress,
                }
              : null,
            stocks: item.product.stocks?.map((s: any) => ({
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
            })),
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

  // POST /api/cart : 장바구니 생성 (또는 기존 카트 반환)
  createCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req, res, next);

      const cart = await cartService.createCart(userId);
      if (!cart) {
        throw new HttpException({
          status: STATUS_CODE.INTERNAL_SERVER_ERROR,
          message: '장바구니 생성에 실패했습니다.',
        });
      }

      return res.status(STATUS_CODE.CREATED).json({
        id: cart.id,
        buyerId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      });
    } catch (error) {
      return next(error);
    }
  };

  // PATCH /api/cart : 장바구니 수정 (아이템 추가/수정)
  patchCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req, res, next);

      const body = req.body as PatchCartInput;
      const items = await cartService.patchCart(userId, body);

      return res.status(STATUS_CODE.OK).json(items);
    } catch (error) {
      return next(error);
    }
  };

  // DELETE /api/cart/:cartItemId : 장바구니 아이템 삭제
  deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req, res, next);

      const cartItemId = req.params.cartItemId;
      if (!cartItemId) {
        throw HttpException.badRequest('잘못된 요청입니다.');
      }

      const deletedCount = await cartService.removeCartItem(userId, cartItemId);
      if (!deletedCount) {
        throw HttpException.notFound('장바구니에 아이템이 없습니다.');
      }

      return res.status(STATUS_CODE.NO_CONTENT).send();
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/cart : 장바구니 조회
  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req, res, next);

      const cart = await getCartWithItems(userId);

      // 장바구니가 없으면 404
      if (!cart) {
        throw HttpException.notFound('장바구니를 찾을 수 없습니다.');
      }

      // 아이템이 없으면 빈 배열로 반환
      const items = cart.items || [];

      return res.status(STATUS_CODE.OK).json({
        id: cart.id,
        buyerId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        items: items.map((item) => this.transformCartItem(item)),
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/cart/:cartItemId : 장바구니 아이템 상세 조회
  getCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req, res, next);

      const { cartItemId } = req.params;
      if (!cartItemId) {
        throw HttpException.badRequest('잘못된 요청입니다.');
      }

      const item = await getCartItemWithDetails(userId, cartItemId);
      if (!item) {
        throw HttpException.notFound('장바구니에 아이템이 없습니다.');
      }

      const transformed = {
        ...this.transformCartItem(item),
        cart: item.cart
          ? {
              id: item.cart.id,
              buyerId: item.cart.userId,
              createdAt: item.cart.createdAt,
              updatedAt: item.cart.updatedAt,
            }
          : item.cart,
      };

      return res.status(STATUS_CODE.OK).json(transformed);
    } catch (error) {
      return next(error);
    }
  };
}

export const cartController = new CartController();
