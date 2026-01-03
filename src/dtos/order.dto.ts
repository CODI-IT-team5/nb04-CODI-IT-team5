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
export const createOrderDto = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  cartItemIds: z.array(z.string()).optional(), // 선택한 아이템만 주문 (없으면 전체)
  usePoint: z.number().int().min(0).optional(),
});

export const updateOrderDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
