import { NotificationType, OrderStatus, PaymentStatus, PointHistoryType } from '@prisma/client';

import { MESSAGE } from '../constants/constant.js';
import type { CreateOrderInput, GetOrdersQuery, UpdateOrderInput } from '../dtos/order.dto.js';
import { cartRepository } from '../repositories/cart.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { OrderResponse } from '../serializes/order.serialize.js';
import { HttpException } from '../utils/http-exception.js';
import { logger } from '../utils/logger.js';
import prisma from '../utils/prisma.js';
import { metadataService } from './metadata.service.js';
import { notificationService } from './notification.service.js';

class OrderService {
  /**
   * 주문 목록 조회
   */
  getOrders = async (input: GetOrdersQuery & { userId: string }) => {
    const { userId, status, limit = 10, page = 1 } = input;

    // exactOptionalPropertyTypes 대응
    const repoInput = {
      userId,
      limit,
      page,
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      orderRepository.countByUserId(userId, status),
      orderRepository.findManyByUserId(repoInput),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const meta = { total, page, limit, totalPages };

    return OrderResponse.paginated(orders, meta);
  };

  /**
   * 주문 상세 조회
   */
  getOrderById = async (userId: string, orderId: string) => {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw HttpException.notFound('주문을 찾을 수 없습니다.');
    }
    if (order.userId !== userId) {
      throw HttpException.forbidden();
    }

    return OrderResponse.single(order);
  };

  /**
   * 주문 생성
   */
  createOrder = async (userId: string, input: CreateOrderInput) => {
    const { name, phone, address, orderItems, usePoint = 0, isTest = false } = input;

    let finalPriceForGradeUpdate = 0;

    const createdOrder = await prisma.$transaction(
      async (tx) => {
        // 1. 상품 정보 및 재고 조회, 가격 계산
        let subtotal = 0;
        const computedItems: {
          productId: string;
          sizeId: number;
          quantity: number;
          price: number;
          productName: string;
          sizeName: string; // 사이즈 이름을 저장하기 위해 추가
        }[] = [];

        for (const item of orderItems) {
          const productStock = await tx.productStock.findFirst({
            where: { productId: item.productId, sizeId: item.sizeId },
            include: {
              product: {
                select: { price: true, isSoldOut: true, name: true },
              },
              size: true, // 사이즈 정보를 함께 가져옵니다.
            },
          });

          if (!productStock || productStock.product.isSoldOut || productStock.quantity < item.quantity) {
            // 구매자에게 품절 알림 전송 (주문 시점에 재고 부족)
            await notificationService.createNotification({
              userId: userId,
              type: NotificationType.PRODUCT_SOLDOUT_FOR_BUYER,
              content: `주문하려는 상품 '${productStock?.product.name}' (${
                productStock?.size?.name ?? item.sizeId
              } 사이즈)의 재고가 부족하거나 품절되었습니다.`,
              url: `/products/${item.productId}`, // 상품 상세 페이지로 연결
            });
            throw HttpException.badRequest(
              MESSAGE.insufficientStock(productStock?.size?.name ?? item.sizeId, productStock?.quantity ?? 0),
            );
          }

          const unitPrice = productStock.product.price;
          subtotal += unitPrice * item.quantity;

          computedItems.push({
            productId: item.productId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            price: unitPrice,
            productName: productStock.product.name,
            sizeName: productStock.size.name, // 사이즈 이름을 저장합니다.
          });
        }

        // 2. 사용자 포인트 검증 (등급 정보 포함 조회)
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { grade: true },
        });
        if (!user) throw HttpException.userNotFound();
        if (usePoint > user.points) throw HttpException.badRequest(MESSAGE.insufficientPoints);

        const finalPrice = Math.max(subtotal - usePoint, 0);
        finalPriceForGradeUpdate = finalPrice; // 등급 업데이트를 위해 최종 가격 저장

        // 3. 주문 상태 결정
        const orderStatus = isTest ? OrderStatus.WaitingPayment : OrderStatus.CompletedPayment;
        const paymentStatus = isTest ? PaymentStatus.Pending : PaymentStatus.CompletedPayment;

        // 4. 주문 생성
        const order = await tx.order.create({
          data: {
            userId,
            name,
            phoneNumber: phone,
            address,
            email: user.email,
            subtotal: finalPrice,
            usePoint,
            status: orderStatus,
            orderItems: {
              create: computedItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productName: item.productName,
                productId: item.productId,
                sizeId: item.sizeId,
              })),
            },
            payment: {
              create: {
                price: finalPrice,
                status: paymentStatus,
              },
            },
          },
        });

        // 5. 재고 차감 및 판매량 업데이트
        for (const item of computedItems) {
          const updatedProductStock = await tx.productStock.update({
            where: { productId_sizeId: { productId: item.productId, sizeId: item.sizeId } },
            data: { quantity: { decrement: item.quantity } },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { salesCount: { increment: item.quantity } },
          });

          // 재고 감소 후 재고 수량이 0이 되었는지 확인
          if (updatedProductStock.quantity === 0) {
            // 1. 판매자에게 품절 알림 전송
            const productWithStoreOwner = await productRepository.findByIdWithStoreOwner(item.productId);
            if (productWithStoreOwner?.store?.userId) {
              await notificationService.createNotification({
                userId: productWithStoreOwner.store.userId,
                type: NotificationType.PRODUCT_SOLDOUT_FOR_SELLER,
                content: `판매 중인 상품 '${item.productName}' (${item.sizeName ?? item.sizeId} 사이즈)의 재고가 소진되었습니다.`,
                url: `/seller/products/${item.productId}`,
              });
            }

            // 2. 해당 상품을 장바구니에 담은 다른 구매자들에게 품절 알림 전송
            const userIdsInCart = await cartRepository.findUserIdsByProductInCart(
              item.productId,
              updatedProductStock.sizeId,
            );
            for (const buyerId of userIdsInCart) {
              // 현재 주문하는 사용자는 제외
              if (buyerId !== userId) {
                await notificationService.createNotification({
                  userId: buyerId,
                  type: NotificationType.PRODUCT_SOLDOUT_FOR_BUYER,
                  content: `장바구니에 담아둔 상품 '${item.productName}' (${
                    item.sizeName ?? item.sizeId
                  } 사이즈)의 재고가 모두 소진되었습니다.`,
                  url: `/products/${item.productId}`,
                });
              }
            }
          }
        }

        // 6. 장바구니 비우기
        const userCart = await cartRepository.findCartByUserId(userId);
        if (userCart) {
          const productIdsToRemove = orderItems.map((item) => item.productId);
          await tx.cartItem.deleteMany({
            where: {
              cartId: userCart.id,
              productId: { in: productIdsToRemove },
            },
          });
        }

        // 7. 포인트 사용/적립 (실제 주문일 경우에만) - 등급 업데이트 로직은 분리
        if (!isTest) {
          if (usePoint > 0) {
            await tx.pointHistory.create({
              data: {
                userId,
                orderId: order.id,
                title: '주문 시 포인트 사용',
                point: -usePoint,
                type: PointHistoryType.USE,
              },
            });
          }

          const earnedPoints = Math.floor(finalPrice * (user.grade.rate / 100));
          if (earnedPoints > 0) {
            await tx.pointHistory.create({
              data: {
                userId,
                orderId: order.id,
                title: '상품 구매 적립',
                point: earnedPoints,
                type: PointHistoryType.EARN,
              },
            });
          }

          // 사용자 누적 금액 및 포인트 최종 업데이트
          const netPointChange = earnedPoints - usePoint;
          await tx.user.update({
            where: { id: userId },
            data: {
              points: { increment: netPointChange },
              totalAmount: { increment: finalPrice },
            },
          });
        }

        return order;
      },
      { maxWait: 5000, timeout: 20000 },
    );

    // 트랜잭션 성공 후, 등급 업데이트 및 알림 전송 로직 호출
    if (!isTest && finalPriceForGradeUpdate > 0) {
      try {
        await metadataService.updateTotalAmount({
          userId: userId,
          deltaAmount: finalPriceForGradeUpdate,
        });
      } catch (err) {
        // 등급 업데이트 실패가 주문 생성의 성공에 영향을 주지 않도록 로깅만 처리
        logger.error(err, '주문 후 등급 업데이트 실패');
      }
    }

    // 8. 최종 결과 반환
    const detailedOrder = await orderRepository.findById(createdOrder.id);
    return OrderResponse.single(detailedOrder!);
  };

  /**
   * 주문 취소
   */
  deleteOrder = async (userId: string, orderId: string) => {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { orderItems: true },
      });

      if (!order) throw HttpException.notFound('주문을 찾을 수 없습니다.');
      if (order.status !== 'WaitingPayment') throw HttpException.badRequest(MESSAGE.orderCancellationFailed);

      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.Cancelled } });

      for (const item of order.orderItems) {
        await tx.productStock.update({
          where: { productId_sizeId: { productId: item.productId, sizeId: item.sizeId } },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { salesCount: { decrement: item.quantity } },
        });
      }

      if (order.usePoint > 0) {
        await tx.user.update({ where: { id: userId }, data: { points: { increment: order.usePoint } } });
        await tx.pointHistory.create({
          data: {
            userId,
            orderId: order.id,
            title: '주문 취소로 인한 포인트 복구',
            point: order.usePoint,
            type: PointHistoryType.EARN,
          },
        });
      }

      return { message: '주문이 성공적으로 취소되었습니다.' };
    });
  };

  /**
   * 주문 정보 수정 (배송지)
   */
  updateOrder = async (userId: string, orderId: string, input: UpdateOrderInput) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw HttpException.notFound('주문을 찾을 수 없습니다.');

    // exactOptionalPropertyTypes 대응
    const dataToUpdate: { name?: string; phoneNumber?: string; address?: string } = {};
    if (input.name) dataToUpdate.name = input.name;
    if (input.phone) dataToUpdate.phoneNumber = input.phone;
    if (input.address) dataToUpdate.address = input.address;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    const detailedOrder = await orderRepository.findById(updatedOrder.id);
    return OrderResponse.single(detailedOrder!);
  };
}

export const orderService = new OrderService();
