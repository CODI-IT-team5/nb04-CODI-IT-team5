// src/cart/cart.controller.ts

import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import type { PatchCartInput } from '../dtos/cart.dto.js';
import { CartResponse } from '../serializes/cart.serialize.js';
import { cartService } from '../services/cart.service.js';
import { HttpException } from '../utils/http-exception.js';

class CartController {
  // POST /api/cart : 장바구니 생성 (또는 기존 카트 반환)
  createCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const cart = await cartService.createCart(userId);
      if (!cart) {
        throw new HttpException({
          status: STATUS_CODE.INTERNAL_SERVER_ERROR,
          message: MESSAGE.cartCreationFailed,
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
      const userId = req.user!.id;

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
      const userId = req.user!.id;
      const cartItemId = req.params.cartItemId as string;

      const deletedCount = await cartService.removeCartItem(userId, cartItemId);
      if (!deletedCount) {
        throw HttpException.notFound(MESSAGE.cartItemNotFound);
      }

      return res.status(STATUS_CODE.NO_CONTENT).send();
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/cart : 장바구니 조회
  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const cart = await cartService.getCartWithItems(userId);

      // 장바구니가 없으면 404
      if (!cart) {
        throw HttpException.notFound(MESSAGE.cartNotFound);
      }

      // 아이템이 없으면 빈 배열로 반환
      const items = cart.items || [];

      return res.status(STATUS_CODE.OK).json({
        id: cart.id,
        buyerId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        items: items.map((item) => CartResponse.transformCartItem(item)),
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/cart/:cartItemId : 장바구니 아이템 상세 조회 (Swagger 스펙 준수)
  getCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const cartItemId = req.params.cartItemId as string;

      const item = await cartService.getCartItemWithDetails(userId, cartItemId);
      if (!item) {
        throw HttpException.notFound(MESSAGE.cartItemNotFound);
      }

      return res.status(STATUS_CODE.OK).json(CartResponse.transformCartItemSimple(item));
    } catch (error) {
      return next(error);
    }
  };
}

export const cartController = new CartController();
