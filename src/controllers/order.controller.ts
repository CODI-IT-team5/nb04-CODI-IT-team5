import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import type { CreateOrderInput, GetOrdersQuery, UpdateOrderInput } from '../dtos/order.dto.js';
import { orderService } from '../services/order.service.js';

class OrderController {
  /**
   * 주문 목록 조회
   */
  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const query = req.query as GetOrdersQuery;

      const result = await orderService.getOrders({
        userId,
        status: query.status,
        limit: query.limit ?? 10,
        page: query.page ?? 1,
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
      const orderId = req.params.orderId!;

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
      const orderData = req.body as CreateOrderInput;

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
      const orderId = req.params.orderId!;

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
      const orderId = req.params.orderId!;
      const orderData = req.body as UpdateOrderInput;

      const result = await orderService.updateOrder(userId, orderId, orderData);
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const orderController = new OrderController();
