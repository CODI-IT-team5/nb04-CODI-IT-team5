import type { NextFunction, Request, Response } from 'express';

<<<<<<< HEAD
import { orderService } from '../services/order.service.js';

export const orderController = {
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: '인증이 필요합니다.', path: req.originalUrl });

      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const page = req.query.page ? Number(req.query.page) : 1;

      // exactOptionalPropertyTypes 대응: status를 직관적으로 넘기기
      const result = await orderService.getOrders({ userId, status, limit, page });

      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  // 프론트에서는 사용되지 않는 부분.
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: '인증이 필요합니다.', path: req.originalUrl });

      const { orderId } = req.params;
      if (!orderId) return res.status(400).json({ message: 'orderId가 필요합니다.', path: req.originalUrl });

      const order = await orderService.getOrderById({ userId, orderId });
      return res.status(200).json(order);
    } catch (err) {
      return next(err);
    }
  },

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: '인증이 필요합니다.', path: req.originalUrl });

      const result = await orderService.createOrder({ userId, ...req.body });
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: '인증이 필요합니다.', path: req.originalUrl });

      const { orderId } = req.params;
      if (!orderId) return res.status(400).json({ message: 'orderId가 필요합니다.', path: req.originalUrl });

      await orderService.deleteOrder({ userId, orderId });
      return res.status(200).json({ message: '주문이 성공적으로 취소되고 포인트가 복구되었습니다.' });
    } catch (err) {
      return next(err);
    }
  },

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    // 프론트에서는 사용되지 않는 부분.
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: '인증이 필요합니다.', path: req.originalUrl });

      const { orderId } = req.params;
      if (!orderId) return res.status(400).json({ message: 'orderId가 필요합니다.', path: req.originalUrl });

      const result = await orderService.updateOrder({ userId, orderId, ...req.body });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
=======
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
>>>>>>> origin/dev
