import type { NextFunction, Request, Response } from 'express';

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
