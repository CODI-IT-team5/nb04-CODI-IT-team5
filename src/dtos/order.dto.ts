import { z } from 'zod';

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

export const updateOrderDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
