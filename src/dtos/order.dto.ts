import { z } from 'zod';

export const getOrdersQueryDto = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const orderIdParamDto = z.object({
  orderId: z.string().min(1),
});

export const createOrderItemDto = z.object({
  productId: z.string().min(1),
  sizeId: z.coerce.string().min(1),
  quantity: z.number().int().positive(),
});

export const createOrderDto = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  orderItems: z.array(createOrderItemDto).min(1),
  usePoint: z.number().int().min(0).optional(),
});

export const updateOrderDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
