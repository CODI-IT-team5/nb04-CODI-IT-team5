import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import type { createOrderDto, getOrdersQueryDto, updateOrderDto } from '../dtos/order.dto.js';
import { orderService } from '../services/order.service.js';
import { HttpException } from '../utils/http-exception.js';

class OrderController {
  /**
   * 주문 목록 조회
   */
  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, limit = 10, page = 1 } = req.query as unknown as getOrdersQueryDto;

      const result = await orderService.getOrders({
        userId,
        status,
        limit,
        page,
      });

      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * 주문 상세 조회
   */
  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;

      const order = await orderService.getOrderById(userId, orderId);
      return res.status(STATUS_CODE.OK).json(order);
    } catch (err) {
      next(err);
    }
  };

  /**
   * 주문 생성
   */
  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const orderData = req.body as createOrderDto;

      const result = await orderService.createOrder(userId, orderData);
      return res.status(STATUS_CODE.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * 주문 취소
   */
  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;

      const result = await orderService.deleteOrder(userId, orderId);
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * 주문 정보 수정 (배송지)
   */
  updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;
      const orderData = req.body as updateOrderDto;

      const result = await orderService.updateOrder(userId, orderId, orderData);
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const orderController = new OrderController();
