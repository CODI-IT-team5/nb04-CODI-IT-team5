import express from 'express';

import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';
import { orderController } from '../controllers/order.controller.js';
import { createOrderDto, getOrdersQueryDto, orderIdParamDto, updateOrderDto } from '../dtos/order.dto.js';

export const orderRouter = express.Router();

orderRouter.get('/', authMiddleware, validateMiddleware({ query: getOrdersQueryDto }), orderController.getOrders);
// 프론트에서는 사용되지 않는 부분.
orderRouter.get(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto }),
  orderController.getOrderById,
);
orderRouter.post('/', authMiddleware, validateMiddleware({ body: createOrderDto }), orderController.createOrder);
orderRouter.delete(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto }),
  orderController.deleteOrder,
);
// 프론트에서는 사용되지 않는 부분.
orderRouter.patch(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto, body: updateOrderDto }),
  orderController.updateOrder,
);
