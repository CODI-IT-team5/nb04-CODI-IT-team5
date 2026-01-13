import { z } from 'zod';

// GET /api/orders
export const getOrdersQueryDto = z.object({
  status: z
    .enum(['WaitingPayment', 'CompletedPayment', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'Refunded'])
    .optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  page: z.coerce.number().int().positive().optional(),
});
export type GetOrdersQuery = z.infer<typeof getOrdersQueryDto>;

// POST /api/orders
const createOrderItemSchema = z.object({
  // productId: z.string().cuid(), (임시) 테스트를 위해서 cuid 검증 X
  productId: z.string(),
  sizeId: z.number(),
  quantity: z.number().int().positive(),
});

export const createOrderDto = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().min(1, '전화번호를 입력해주세요.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  orderItems: z.array(createOrderItemSchema).min(1, '주문할 상품이 없습니다.'),
  usePoint: z.number().int().min(0).optional(),
  isTest: z.boolean().optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderDto>;

// PATCH /api/orders/:orderId
export const updateOrderDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderDto>;

// PARAMS /api/orders/:orderId
export const orderIdParamDto = z.object({
  orderId: z.string().cuid(),
});

// Consolidated orderDto for validateMiddleware
export const orderDto = {
  createOrder: {
    body: createOrderDto,
  },
  getOrders: {
    query: getOrdersQueryDto,
  },
  getOrderById: {
    params: orderIdParamDto,
  },
  updateOrder: {
    params: orderIdParamDto,
    body: updateOrderDto,
  },
  deleteOrder: {
    params: orderIdParamDto,
  },
};
