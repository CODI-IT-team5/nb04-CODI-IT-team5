import type { OrderStatus, PaymentStatus } from '@prisma/client';

import { HttpException } from '../utils/http-exception.js';
import prisma from '../utils/prisma.js';

export type GetOrdersInput = {
  userId: string;
  status: string | undefined; // 너가 원한 “직관적 undefined” 유지
  limit: number;
  page: number;
};
// size 구조 변환 헬퍼 함수
function transformSize(size: { id: string; name: string; sizeDetail: unknown } | null) {
  if (!size) return size;

  const sizeDetail = size.sizeDetail as { en?: string; ko?: string } | null;

  return {
    id: size.id,
    size: sizeDetail || { en: size.name || '', ko: size.name || '' },
  };
}
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
                  store: {
                    select: {
                      id: true,
                      userId: true,
                      name: true,
                      address: true,
                      phoneNumber: true,
                      content: true,
                      image: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                  stocks: {
                    select: {
                      id: true,
                      productId: true,
                      sizeId: true,
                      quantity: true,
                      size: true,
                    },
                  },
                  productDiscounts: {
                    where: {
                      revokedAt: null,
                      discountStartTime: { lte: new Date() },
                      discountEndTime: { gte: new Date() },
                    },
                    select: {
                      discountRate: true,
                      discountStartTime: true,
                      discountEndTime: true,
                    },
                    take: 1,
                  },
                },
              },
              size: true,
              review: true,
            },
          },
          payment: true,
        },
      }),
    ]);

    // totalQuantity를 orderItems로부터 계산 및 응답 변환
    const dataWithTotalQuantity = data.map((order: (typeof data)[0]) => ({
      ...order,
      payments: order.payment, // payment → payments 필드명 변경
      payment: undefined, // 기존 필드 제거
      totalQuantity: order.orderItems.reduce(
        (sum: number, item: (typeof order.orderItems)[0]) => sum + item.quantity,
        0,
      ),
      orderItems: order.orderItems.map((item: (typeof order.orderItems)[0]) => ({
        ...item,
        size: transformSize(item.size),
      })),
    }));

    return {
      data: dataWithTotalQuantity,
      meta: {
        total,
        page: safePage,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  // 프론트에서는 사용되지 않는 부분.
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
                store: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                    address: true,
                    phoneNumber: true,
                    content: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                stocks: {
                  select: {
                    id: true,
                    productId: true,
                    sizeId: true,
                    quantity: true,
                    size: true,
                  },
                },
                productDiscounts: {
                  where: {
                    revokedAt: null,
                    discountStartTime: { lte: new Date() },
                    discountEndTime: { gte: new Date() },
                  },
                  select: {
                    discountRate: true,
                    discountStartTime: true,
                    discountEndTime: true,
                  },
                  take: 1,
                },
              },
            },
            size: true,
            review: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw HttpException.notFound();
    }

    // totalQuantity를 orderItems로부터 계산 및 응답 변환
    return {
      ...order,
      payments: order.payment, // payment → payments 필드명 변경
      payment: undefined, // 기존 필드 제거
      totalQuantity: order.orderItems.reduce(
        (sum: number, item: (typeof order.orderItems)[0]) => sum + item.quantity,
        0,
      ),
      orderItems: order.orderItems.map((item: (typeof order.orderItems)[0]) => ({
        ...item,
        size: transformSize(item.size),
      })),
    };
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
    const order = await prisma.$transaction(async (tx) => {
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
          include: {
            product: {
              select: {
                price: true,
                isSoldOut: true,
                name: true,
                productDiscounts: {
                  where: {
                    revokedAt: null,
                    discountStartTime: { lte: new Date() },
                    discountEndTime: { gte: new Date() },
                  },
                  select: {
                    discountRate: true,
                  },
                  take: 1,
                },
              },
            },
          },
        });

        if (!stock || stock.product.isSoldOut || stock.quantity < item.quantity) {
          throw HttpException.badRequest('품절되었거나 재고가 부족합니다.');
        }

        // 할인율 적용
        let unitPrice = stock.product.price;
        const activeDiscount = stock.product.productDiscounts?.[0];
        if (activeDiscount) {
          unitPrice = Math.floor(unitPrice * (1 - activeDiscount.discountRate / 100));
        }

        subtotal += unitPrice * item.quantity;

        computedItems.push({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          priceSnapshot: unitPrice,
          productName: stock.product.name,
        });
      }

      // 2) 사용자 포인트 검증 및 차감
      const userRecord = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, points: true },
      });

      if (!userRecord) throw HttpException.badRequest('유저를 찾을 수 없습니다.');

      if (usePoint > userRecord.points) {
        throw HttpException.badRequest('보유 포인트보다 많은 포인트를 사용할 수 없습니다.');
      }

      // 포인트 차감
      if (usePoint > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: usePoint } },
        });
      }

      const finalPrice = Math.max(subtotal - usePoint, 0);

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
              product: {
                select: {
                  id: true,
                  storeId: true,
                  name: true,
                  price: true,
                  image: true,
                  store: {
                    select: {
                      id: true,
                      userId: true,
                      name: true,
                      address: true,
                      phoneNumber: true,
                      content: true,
                      image: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                  stocks: {
                    select: {
                      id: true,
                      productId: true,
                      sizeId: true,
                      quantity: true,
                      size: true,
                    },
                  },
                },
              },
              size: true,
              review: true,
            },
          },
          payment: true,
        },
      });

      // 4) 재고 차감 및 판매량 업데이트, 품절 처리
      for (const ci of computedItems) {
        // 재고 차감
        const updatedStock = await tx.productStock.update({
          where: { productId_sizeId: { productId: ci.productId, sizeId: ci.sizeId } },
          data: { quantity: { decrement: ci.quantity } },
        });

        // 판매량 증가
        await tx.product.update({
          where: { id: ci.productId },
          data: { salesCount: { increment: ci.quantity } },
        });

        // 품절 처리: 해당 상품의 모든 재고를 확인
        const allStocks = await tx.productStock.findMany({
          where: { productId: ci.productId },
        });

        const isAllSoldOut = allStocks.every((s: (typeof allStocks)[0]) =>
          s.id === updatedStock.id ? updatedStock.quantity === 0 : s.quantity === 0,
        );

        if (isAllSoldOut) {
          await tx.product.update({
            where: { id: ci.productId },
            data: { isSoldOut: true },
          });
        }
      }

      // 5) 포인트 사용 히스토리 생성
      if (usePoint > 0) {
        await tx.pointHistory.create({
          data: {
            userId,
            orderId: order.id,
            title: '주문 시 포인트 사용',
            description: `주문 #${order.id}`,
            point: -usePoint,
            type: 'USE',
          },
        });
      }

      return order;
    });

    // payment → payments 응답 변환 및 size 구조 변환
    return {
      ...order,
      payments: order.payment,
      payment: undefined,
      orderItems: order.orderItems.map((item: (typeof order.orderItems)[0]) => ({
        ...item,
        size: transformSize(item.size),
      })),
    };
  },

  async deleteOrder({ userId, orderId }: { userId: string; orderId: string }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { orderItems: true },
      });

      if (!order) throw HttpException.notFound();
      if (order.status !== 'WaitingPayment') {
        throw HttpException.badRequest('결제 대기 상태인 주문만 취소할 수 있습니다.');
      }

      // 주문 취소
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'Cancelled' },
      });

      // 재고 복구 및 판매량 감소
      for (const item of order.orderItems) {
        // 재고 복구
        await tx.productStock.update({
          where: { productId_sizeId: { productId: item.productId, sizeId: item.sizeId } },
          data: { quantity: { increment: item.quantity } },
        });

        // 판매량 감소
        await tx.product.update({
          where: { id: item.productId },
          data: { salesCount: { decrement: item.quantity } },
        });

        // 품절 해제 (재고가 복구되었으므로)
        await tx.product.update({
          where: { id: item.productId },
          data: { isSoldOut: false },
        });
      }

      // 포인트 복구
      if (order.usePoint > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { increment: order.usePoint } },
        });

        // 포인트 히스토리 생성 (복구)
        await tx.pointHistory.create({
          data: {
            userId,
            orderId: order.id,
            title: '주문 취소로 인한 포인트 복구',
            description: `주문 #${order.id} 취소`,
            point: order.usePoint,
            type: 'EARN',
          },
        });
      }

      return null;
    });
  },

  async updateOrder(input: { userId: string; orderId: string; name?: string; phone?: string; address?: string }) {
    const { userId, orderId, name, phone, address } = input;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw HttpException.notFound();

    const updateData: { name?: string; phoneNumber?: string; address?: string } = {};
    if (name) updateData.name = name;
    if (phone) updateData.phoneNumber = phone;
    if (address) updateData.address = address;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
                store: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                    address: true,
                    phoneNumber: true,
                    content: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                stocks: {
                  select: {
                    id: true,
                    productId: true,
                    sizeId: true,
                    quantity: true,
                    size: true,
                  },
                },
              },
            },
            size: true,
          },
        },
        payment: true,
      },
    });

    return {
      ...updated,
      totalQuantity: updated.orderItems.reduce(
        (sum: number, item: (typeof updated.orderItems)[0]) => sum + item.quantity,
        0,
      ),
    };
  },
};
