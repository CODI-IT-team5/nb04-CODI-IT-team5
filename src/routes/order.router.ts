import express from 'express';

import { orderController } from '../controllers/order.controller.js';
import { orderDto } from '../dtos/order.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

const orderRouter = express.Router();

// GET /api/orders - 주문 목록 조회
orderRouter.get('/', authMiddleware, validateMiddleware(orderDto.getOrders), orderController.getOrders);

// POST /api/orders - 주문 생성
orderRouter.post('/', authMiddleware, validateMiddleware(orderDto.createOrder), orderController.createOrder);

// GET /api/orders/:orderId - 주문 상세 조회
orderRouter.get('/:orderId', authMiddleware, validateMiddleware(orderDto.getOrderById), orderController.getOrderById);

// DELETE /api/orders/:orderId - 주문 취소
orderRouter.delete('/:orderId', authMiddleware, validateMiddleware(orderDto.deleteOrder), orderController.deleteOrder);

// PATCH /api/orders/:orderId - 주문 정보 수정
orderRouter.patch('/:orderId', authMiddleware, validateMiddleware(orderDto.updateOrder), orderController.updateOrder);

export { orderRouter };
