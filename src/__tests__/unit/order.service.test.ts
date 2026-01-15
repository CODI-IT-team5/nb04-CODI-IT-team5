import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OrderStatus } from '@prisma/client';

describe('OrderService - 유닛 테스트', () => {
  let orderService: any;
  let orderRepository: any;

  beforeEach(async () => {
    // 모듈 동적 import
    const orderServiceModule = await import('../../services/order.service.js');
    const orderRepositoryModule = await import('../../repositories/order.repository.js');

    orderService = orderServiceModule.orderService;
    orderRepository = orderRepositoryModule.orderRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrders', () => {
    it('주문 목록을 페이지네이션으로 반환해야 함', async () => {
      // Arrange
      const userId = 'user1';
      const mockOrders = [
        {
          id: 'order1',
          userId,
          name: 'Test User',
          phoneNumber: '010-1234-5678',
          address: '서울시',
          subtotal: 10000,
          usePoint: 0,
          status: OrderStatus.Processing,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderItems: [],
        },
      ];

      jest.spyOn(orderRepository, 'countByUserId').mockResolvedValue(1);
      jest.spyOn(orderRepository, 'findManyByUserId').mockResolvedValue(mockOrders as any);

      // Act
      const result = await orderService.getOrders({
        userId,
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('상태별 주문 목록을 필터링해야 함', async () => {
      // Arrange
      const userId = 'user1';
      const mockOrders = [
        {
          id: 'order1',
          userId,
          name: 'Test User',
          phoneNumber: '010-1234-5678',
          address: '서울시',
          subtotal: 10000,
          usePoint: 0,
          status: OrderStatus.CompletedPayment,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderItems: [],
        },
      ];

      jest.spyOn(orderRepository, 'countByUserId').mockResolvedValue(1);
      jest.spyOn(orderRepository, 'findManyByUserId').mockResolvedValue(mockOrders as any);

      // Act
      const result = await orderService.getOrders({
        userId,
        status: OrderStatus.CompletedPayment,
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getOrderById', () => {
    it('주문 상세 정보를 반환해야 함', async () => {
      // Arrange
      const userId = 'user1';
      const orderId = 'order1';
      const mockOrder = {
        id: orderId,
        userId,
        name: 'Test User',
        phoneNumber: '010-1234-5678',
        address: '서울시',
        subtotal: 10000,
        usePoint: 0,
        status: OrderStatus.Processing,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderItems: [],
        payments: null,
      };

      jest.spyOn(orderRepository, 'findById').mockResolvedValue(mockOrder as any);

      // Act
      const result = await orderService.getOrderById(userId, orderId);

      // Assert
      expect(result.id).toBe(orderId);
    });

    it('본인의 주문이 아니면 에러를 반환해야 함', async () => {
      // Arrange
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
      };

      jest.spyOn(orderRepository, 'findById').mockResolvedValue(mockOrder as any);

      // Act & Assert
      await expect(orderService.getOrderById('user2', 'order1')).rejects.toThrow();
    });

    it('존재하지 않는 주문 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(orderRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(orderService.getOrderById('user1', 'nonexistent')).rejects.toThrow();
    });
  });
});
