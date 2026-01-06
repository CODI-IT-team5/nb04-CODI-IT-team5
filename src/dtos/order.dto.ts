import { z } from 'zod';

<<<<<<< HEAD
export const getOrdersQueryDto = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const orderIdParamDto = z.object({
  orderId: z.string().min(1),
});

// Cart 기반 주문 생성 - orderItems 제거, cartItemIds 추가
const orderItemDto = z.object({
  productId: z.string().min(1),
  sizeId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createOrderDto = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    // swagger 스펙: orderItems 기반. 단, cart 선택 주문을 위해 cartItemIds도 허용
    orderItems: z.array(orderItemDto).optional(),
    cartItemIds: z.array(z.string()).optional(),
    usePoint: z.number().int().min(0).optional(),
  })
  .refine((data) => (data.orderItems && data.orderItems.length > 0) || (data.cartItemIds && data.cartItemIds.length > 0), {
    message: 'orderItems 또는 cartItemIds 중 하나는 필수입니다.',
    path: ['orderItems'],
  });

=======
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
  sizeId: z.string(), // sizeId는 'size_s' 같은 문자열일 수 있으므로 cuid()가 아님
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
>>>>>>> origin/dev
export const updateOrderDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
<<<<<<< HEAD
=======
export type UpdateOrderInput = z.infer<typeof updateOrderDto>;

// PARAMS /api/orders/:orderId
export const orderIdParamDto = z.object({
  orderId: z.string().cuid(),
});
>>>>>>> origin/dev
