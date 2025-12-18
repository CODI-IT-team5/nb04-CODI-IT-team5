import express from 'express';

import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';
import { orderController } from '../controllers/order.controller.js';
import { createOrderDto, getOrdersQueryDto, orderIdParamDto } from '../dtos/order.dto.js';

export const orderRouter = express.Router();

orderRouter.get('/', authMiddleware, validateMiddleware({ query: getOrdersQueryDto }), orderController.getOrders);
orderRouter.get(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto }),
  orderController.getOrderById,
);
orderRouter.post('/', authMiddleware, validateMiddleware({ body: createOrderDto }), orderController.createOrder);
