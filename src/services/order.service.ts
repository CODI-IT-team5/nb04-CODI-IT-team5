import type { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Prisma as PrismaClient } from '@prisma/client';

import * as cartRepository from '../repositories/cart.repository.js';
import { HttpException } from '../utils/http-exception.js';
import prisma from '../utils/prisma.js';

export type GetOrdersInput = {
  userId: string;
  status: string | undefined;
  limit: number;
  page: number;
};

const orderItemInclude = PrismaClient.validator<Prisma.OrderItemInclude>()({
  product: {
    select: {
      name: true,
      image: true,
      reviews: {
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
    },
  },
  size: true,
});

const orderInclude = PrismaClient.validator<Prisma.OrderInclude>()({
  orderItems: {
    include: orderItemInclude,
  },
  payment: true,
});

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type OrderItemWithProduct = Prisma.OrderItemGetPayload<{ include: typeof orderItemInclude }>;
type ProductReview = { id: string; rating: number; content: string; createdAt: Date };

const transformSize = (size: { id: string; name: string; sizeDetail: Prisma.JsonValue } | null) => {
  if (!size) return size;
  const detail = size.sizeDetail as { en?: string; ko?: string } | null;
  return {
    id: size.id,
    size: detail || { en: size.name || '', ko: size.name || '' },
  };
};

const mapPaymentStatus = (status: PaymentStatus | null | undefined): 'CompletedPayment' | 'CancelledPayment' | 'WaitingPayment' | null => {
  if (!status) return null;
  if (status === 'CompletedPayment') return 'CompletedPayment';
  if (status === 'Pending') return 'WaitingPayment';
  return 'CancelledPayment';
};

const formatOrder = (order: OrderWithItems) => {
  const totalQuantity = order.orderItems?.reduce((sum: number, item: OrderItemWithProduct) => sum + item.quantity, 0) ?? 0;
  const payments = order.payment
    ? {
        id: order.payment.id,
        price: order.payment.price,
        status: mapPaymentStatus(order.payment.status),
        createdAt: order.payment.createdAt,
        updatedAt: order.payment.updatedAt,
        orderId: order.payment.orderId,
      }
    : null;

  return {
    id: order.id,
    name: order.name,
    phoneNumber: order.phoneNumber,
    address: order.address,
    subtotal: order.subtotal,
    totalQuantity,
    usePoint: order.usePoint,
    createdAt: order.createdAt,
    orderItems: order.orderItems?.map((item: OrderItemWithProduct) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      productId: item.productId,
      product: item.product
        ? {
            name: item.product.name,
            image: item.product.image,
            reviews: item.product.reviews?.map((r: ProductReview) => ({
              id: r.id,
              rating: r.rating,
              content: r.content,
              createdAt: r.createdAt,
            })),
          }
        : null,
      size: transformSize(item.size),
      isReviewed: item.isReviewed,
    })),
    payments,
  };
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
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: orderInclude }),
    ]);

    return {
      data: data.map(formatOrder),
      meta: {
        total,
        page: safePage,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async getOrderById({ userId, orderId }: { userId: string; orderId: string }) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });

    if (!order) throw HttpException.notFound();
    return formatOrder(order);
  },

  // Cart 또는 직접 전달된 orderItems 기반 주문 생성
  async createOrder(input: {
    userId: string;
    name: string;
    phone: string;
    address: string;
    orderItems?: Array<{ productId: string; sizeId: string; quantity: number }>;
    cartItemIds?: string[];
    usePoint?: number;
  }) {
    const { userId, name, phone, address, orderItems, cartItemIds } = input;
    const usePoint = input.usePoint ?? 0;

    const useCart = (cartItemIds && cartItemIds.length > 0) || !orderItems || orderItems.length === 0;

    // 소스 데이터 확보
    const sourceItems = useCart
      ? null
      : orderItems?.map((item) => ({ ...item })) ?? [];

    const cartData = useCart ? await cartRepository.getCartItemsForOrder(userId, cartItemIds) : null;

    if (useCart && (!cartData || !cartData.items || cartData.items.length === 0)) {
      throw HttpException.badRequest('장바구니가 비어 있거나 선택한 상품이 없습니다.');
    }

    // 트랜잭션: 재고 확인 → 주문/결제 생성 → 재고 차감/품절 처리 → Cart 비우기
    const order = await prisma.$transaction(
      async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        const itemsToProcess = useCart ? cartData!.items : sourceItems!;
        let subtotal = 0;

        const computedItems: Array<{
          productId: string;
          sizeId: string;
          quantity: number;
          priceSnapshot: number;
          productName: string;
        }> = [];

        for (const item of itemsToProcess) {
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
                    select: { discountRate: true },
                    take: 1,
                  },
                },
              },
            },
          });

          if (!stock || stock.product.isSoldOut || stock.quantity < item.quantity) {
            throw HttpException.badRequest(`상품 "${item.productId}"의 재고가 부족하거나 품절되었습니다.`);
          }

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

        // 포인트 검증/차감
        const userRecord = await tx.user.findUnique({ where: { id: userId }, select: { email: true, points: true } });
        if (!userRecord) throw HttpException.badRequest('유저를 찾을 수 없습니다.');
        if (usePoint > userRecord.points) {
          throw HttpException.badRequest('보유 포인트보다 많은 포인트를 사용할 수 없습니다.');
        }
        if (usePoint > 0) {
          await tx.user.update({ where: { id: userId }, data: { points: { decrement: usePoint } } });
        }

        const finalPrice = Math.max(subtotal - usePoint, 0);

        // 주문 생성
        const newOrder = await tx.order.create({
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
          include: orderInclude,
        });

        // 재고 차감 및 판매량 증가/품절 처리
        for (const ci of computedItems) {
          const updatedStock = await tx.productStock.update({
            where: { productId_sizeId: { productId: ci.productId, sizeId: ci.sizeId } },
            data: { quantity: { decrement: ci.quantity } },
          });

          await tx.product.update({ where: { id: ci.productId }, data: { salesCount: { increment: ci.quantity } } });

          const allStocks = await tx.productStock.findMany({ where: { productId: ci.productId } });
          const isAllSoldOut = allStocks.every((s) => (s.id === updatedStock.id ? updatedStock.quantity === 0 : s.quantity === 0));
          if (isAllSoldOut) {
            await tx.product.update({ where: { id: ci.productId }, data: { isSoldOut: true } });
          }
        }

        // 포인트 사용 히스토리
        if (usePoint > 0) {
          await tx.pointHistory.create({
            data: {
              userId,
              orderId: newOrder.id,
              title: '주문 시 포인트 사용',
              description: `주문 #${newOrder.id}`,
              point: -usePoint,
              type: 'USE',
            },
          });
        }

        // Cart 비우기 (Cart 사용한 경우에만)
        if (useCart) {
          const idsToDelete = cartData!.items.map((i) => i.id);
          await tx.cartItem.deleteMany({
            where: {
              id: { in: idsToDelete },
              cartId: cartData!.cart.id,
            },
          });
        }

        return newOrder;
      },
    );

    return formatOrder(order);
  },

  async deleteOrder({ userId, orderId }: { userId: string; orderId: string }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, userId }, include: { orderItems: true } });

      if (!order) throw HttpException.notFound();
      if (order.status !== 'WaitingPayment') {
        throw HttpException.badRequest('결제 대기 상태인 주문만 취소할 수 있습니다.');
      }

      await tx.order.update({ where: { id: orderId }, data: { status: 'Cancelled' } });

      for (const item of order.orderItems) {
        await tx.productStock.update({
          where: { productId_sizeId: { productId: item.productId, sizeId: item.sizeId } },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.product.update({ where: { id: item.productId }, data: { salesCount: { decrement: item.quantity } } });
        await tx.product.update({ where: { id: item.productId }, data: { isSoldOut: false } });
      }

      if (order.usePoint > 0) {
        await tx.user.update({ where: { id: userId }, data: { points: { increment: order.usePoint } } });
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

    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw HttpException.notFound();

    const updateData: { name?: string; phoneNumber?: string; address?: string } = {};
    if (name) updateData.name = name;
    if (phone) updateData.phoneNumber = phone;
    if (address) updateData.address = address;

    const updated = await prisma.order.update({ where: { id: orderId }, data: updateData, include: orderInclude });

    return {
      ...formatOrder(updated),
      totalQuantity: updated.orderItems.reduce((sum: number, item: OrderItemWithProduct) => sum + item.quantity, 0),
    };
  },
};
