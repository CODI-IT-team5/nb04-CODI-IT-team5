import type { OrderStatus, PaymentStatus } from '@prisma/client';

import prisma from '../utils/prisma.js';
import { HttpException } from '../utils/http-exception.js';

export type GetOrdersInput = {
  userId: string;
  status: string | undefined; // 너가 원한 “직관적 undefined” 유지
  limit: number;
  page: number;
};

export const orderService = {
  async getOrders({ userId, status, limit, page }: GetOrdersInput) {
    const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const skip = (safePage - 1) * take;

    const where: { userId: string; status?: OrderStatus } = { userId };
    if (status) where.status = status as OrderStatus;

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  storeId: true,
                  name: true,
                  price: true,
                  image: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              size: true,
            },
          },
          payment: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async getOrderById({ userId, orderId }: { userId: string; orderId: string }) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                storeId: true,
                name: true,
                price: true,
                image: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            size: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {throw HttpException.notFound(); }; 
    return order;
  },

  async createOrder(input: {
    userId: string;
    name: string;
    phone: string;
    address: string;
    orderItems: Array<{ productId: string; sizeId: string; quantity: number }>;
    usePoint?: number;
  }) {
    const { userId, name, phone, address, orderItems } = input;
    const usePoint = input.usePoint ?? 0;

    if (orderItems.length === 0) {
      throw HttpException.badRequest('주문 상품이 비어 있습니다.');
    }

    // 트랜잭션으로 “재고 확인 + 주문/결제 생성”을 한 번에 처리
    return prisma.$transaction(async (tx) => {
      // 1) 재고 확인 + 단가 조회
      let subtotal = 0;

      const computedItems: Array<{
        productId: string;
        sizeId: string;
        quantity: number;
        priceSnapshot: number;
        productName: string;
      }> = [];

      for (const item of orderItems) {
        const stock = await tx.productStock.findFirst({
          where: { productId: item.productId, sizeId: item.sizeId },
          include: { product: { select: { price: true, isSoldOut: true, name: true } } },
        });

        if (!stock || stock.product.isSoldOut || stock.quantity < item.quantity) {
          throw HttpException.badRequest('품절되었거나 재고가 부족합니다.');
        }

        const unitPrice = stock.product.price; // “기초”라 할인 로직은 다음 단계에서 확장
        subtotal += unitPrice * item.quantity;

        computedItems.push({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          priceSnapshot: unitPrice,
          productName: stock.product.name,
        });
      }

      // 2) 포인트 (기초: 검증 최소)
      const finalPrice = Math.max(subtotal - usePoint, 0);

      // 3) 주문 생성
      const userRecord = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!userRecord) throw HttpException.badRequest('유저를 찾을 수 없습니다.');

      const order = await tx.order.create({
        data: {
          userId,
          email: userRecord.email,
          name,
          phoneNumber: phone,
          address,
          subtotal: finalPrice,
          usePoint,
          status: 'CompletedPayment' as OrderStatus,
          orderItems: {
            create: computedItems.map((ci) => ({
              quantity: ci.quantity,
              price: ci.priceSnapshot,
              productName: ci.productName,
              product: { connect: { id: ci.productId } },
              size: { connect: { id: ci.sizeId } },
            })),
          },
          payment: {
            create: {
              price: finalPrice,
              status: 'CompletedPayment' as PaymentStatus,
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, storeId: true, name: true, price: true, image: true } },
              size: true,
            },
          },
          payment: true,
        },
      });

      // 4) 재고 차감
      for (const ci of computedItems) {
        await tx.productStock.update({
          where: { productId_sizeId: { productId: ci.productId, sizeId: ci.sizeId } },
          data: { quantity: { decrement: ci.quantity } },
        });
      }

      return order;
    });
  },
};
