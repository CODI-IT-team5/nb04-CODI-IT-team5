import express from 'express';

import { orderController } from '../controllers/order.controller.js';
import { createOrderDto, getOrdersQueryDto, orderIdParamDto, updateOrderDto } from '../dtos/order.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

<<<<<<< HEAD
export const orderRouter = express.Router();

orderRouter.get('/', authMiddleware, validateMiddleware({ query: getOrdersQueryDto }), orderController.getOrders);
// 프론트에서는 사용되지 않는 부분.
=======
const orderRouter = express.Router();

// GET /api/orders - 주문 목록 조회
orderRouter.get('/', authMiddleware, validateMiddleware({ query: getOrdersQueryDto }), orderController.getOrders);

// POST /api/orders - 주문 생성
orderRouter.post('/', authMiddleware, validateMiddleware({ body: createOrderDto }), orderController.createOrder);

// GET /api/orders/:orderId - 주문 상세 조회
>>>>>>> origin/dev
orderRouter.get(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto }),
  orderController.getOrderById,
);
<<<<<<< HEAD
orderRouter.post('/', authMiddleware, validateMiddleware({ body: createOrderDto }), orderController.createOrder);
=======

// DELETE /api/orders/:orderId - 주문 취소
>>>>>>> origin/dev
orderRouter.delete(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto }),
  orderController.deleteOrder,
);
<<<<<<< HEAD
// 프론트에서는 사용되지 않는 부분.
=======

// PATCH /api/orders/:orderId - 주문 정보 수정
>>>>>>> origin/dev
orderRouter.patch(
  '/:orderId',
  authMiddleware,
  validateMiddleware({ params: orderIdParamDto, body: updateOrderDto }),
  orderController.updateOrder,
);
<<<<<<< HEAD
=======

export { orderRouter };
>>>>>>> origin/dev
