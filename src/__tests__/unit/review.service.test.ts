import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('ReviewService - 유닛 테스트', () => {
  let reviewService: typeof import('../../services/review.service.js').default;
  let reviewRepository: typeof import('../../repositories/review.repository.js').default;
  let orderItemRepository: typeof import('../../repositories/order-item.repository.js').default;
  let productRepository: typeof import('../../repositories/product.repository.js').productRepository;

  beforeEach(async () => {
    // 모듈 동적 import
    const reviewServiceModule = await import('../../services/review.service.js');
    const reviewRepositoryModule = await import('../../repositories/review.repository.js');
    const orderItemRepositoryModule = await import('../../repositories/order-item.repository.js');
    const productRepositoryModule = await import('../../repositories/product.repository.js');

    reviewService = reviewServiceModule.default;
    reviewRepository = reviewRepositoryModule.default;
    orderItemRepository = orderItemRepositoryModule.default;
    productRepository = productRepositoryModule.productRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createReview', () => {
    it('리뷰를 생성해야 함', async () => {
      // Arrange
      const mockReviewData = {
        rating: 5,
        content: '정말 좋은 상품입니다!',
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
      };

      const mockOrderItem = {
        id: 'orderItem1',
        productId: 'product1',
        order: {
          userId: 'user1',
        },
      };

      const mockCreatedReview = {
        id: 'review1',
        ...mockReviewData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(orderItemRepository, 'findByIdWithRelations').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(reviewRepository, 'findByOrderItemId').mockResolvedValue(null);
      const createSpy = jest.spyOn(reviewRepository, 'create').mockResolvedValue(mockCreatedReview as any);
      jest.spyOn(orderItemRepository, 'updateIsReviewed').mockResolvedValue(undefined as any);
      jest.spyOn(productRepository, 'updateProductReviewStats').mockResolvedValue(undefined as any);

      // Act
      const result = await reviewService.createReview(mockReviewData);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(mockReviewData);
      expect(result).toEqual(mockCreatedReview);
    });

    it('별점이 1~5 범위를 벗어나면 에러를 반환해야 함', async () => {
      // Arrange
      const invalidReviewData = {
        rating: 6,
        content: '테스트',
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
      };

      // Act & Assert
      await expect(reviewService.createReview(invalidReviewData)).rejects.toThrow();
    });

    it('본인이 구매한 상품이 아니면 에러를 반환해야 함', async () => {
      // Arrange
      const mockReviewData = {
        rating: 5,
        content: '리뷰',
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
      };

      const mockOrderItem = {
        id: 'orderItem1',
        productId: 'product1',
        order: {
          userId: 'user2', // 다른 사용자
        },
      };

      jest.spyOn(orderItemRepository, 'findByIdWithRelations').mockResolvedValue(mockOrderItem as any);

      // Act & Assert
      await expect(reviewService.createReview(mockReviewData)).rejects.toThrow();
    });

    it('이미 리뷰를 작성한 주문 항목이면 에러를 반환해야 함', async () => {
      // Arrange
      const mockReviewData = {
        rating: 5,
        content: '리뷰',
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
      };

      const mockOrderItem = {
        id: 'orderItem1',
        productId: 'product1',
        order: {
          userId: 'user1',
        },
      };

      const existingReview = {
        id: 'review1',
        orderItemId: 'orderItem1',
      };

      jest.spyOn(orderItemRepository, 'findByIdWithRelations').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(reviewRepository, 'findByOrderItemId').mockResolvedValue(existingReview as any);

      // Act & Assert
      await expect(reviewService.createReview(mockReviewData)).rejects.toThrow();
    });
  });

  describe('getReviewById', () => {
    it('리뷰 상세 정보를 반환해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const mockReview = {
        id: reviewId,
        rating: 5,
        content: '좋은 상품',
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);

      // Act
      const result = await reviewService.getReviewById(reviewId);

      // Assert
      expect(result).toEqual(mockReview);
    });

    it('존재하지 않는 리뷰 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(reviewService.getReviewById('nonexistent')).rejects.toThrow();
    });
  });

  describe('getProductReviews', () => {
    const mockProductId = 'product1';
    const mockReviews = [
      {
        id: 'review1',
        rating: 5,
        content: '좋아요',
        userId: 'user1',
        productId: mockProductId,
        createdAt: new Date(),
      },
      {
        id: 'review2',
        rating: 4,
        content: '괜찮아요',
        userId: 'user2',
        productId: mockProductId,
        createdAt: new Date(),
      },
    ];

    it('상품별 리뷰 목록을 페이지네이션으로 반환해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId, name: 'Product 1' };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      jest.spyOn(reviewRepository, 'findByProductIdPaginated').mockResolvedValue({
        reviews: mockReviews as any,
        total: 2,
      });

      // Act
      const result = await reviewService.getProductReviews(mockProductId, 1, 10);

      // Assert
      expect(result.reviews).toEqual(mockReviews);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('존재하지 않는 상품 ID로 요청 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(reviewService.getProductReviews('nonexistent', 1, 10)).rejects.toThrow();
    });

    it('hasNextPage가 올바르게 계산되어야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      jest.spyOn(reviewRepository, 'findByProductIdPaginated').mockResolvedValue({
        reviews: mockReviews as any,
        total: 25,
      });

      // Act
      const result = await reviewService.getProductReviews(mockProductId, 1, 10);

      // Assert
      expect(result.meta.hasNextPage).toBe(true);
    });
  });

  describe('updateReview', () => {
    it('본인의 리뷰를 수정할 수 있어야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const userId = 'user1';
      const updateData = { rating: 4, content: '수정된 리뷰' };

      const mockReview = {
        id: reviewId,
        userId,
        productId: 'product1',
        rating: 5,
        content: '원래 리뷰',
        orderItemId: 'orderItem1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedReview = { ...mockReview, ...updateData };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);
      const updateSpy = jest.spyOn(reviewRepository, 'update').mockResolvedValue(mockUpdatedReview as any);
      jest.spyOn(productRepository, 'updateProductReviewStats').mockResolvedValue(undefined as any);

      // Act
      const result = await reviewService.updateReview(reviewId, userId, updateData);

      // Assert
      expect(updateSpy).toHaveBeenCalledWith(reviewId, updateData);
      expect(result).toEqual(mockUpdatedReview);
    });

    it('다른 사용자의 리뷰 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const userId = 'user2';
      const updateData = { rating: 4 };

      const mockReview = {
        id: reviewId,
        userId: 'user1',
        productId: 'product1',
      };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);

      // Act & Assert
      await expect(reviewService.updateReview(reviewId, userId, updateData)).rejects.toThrow();
    });

    it('별점이 1~5 범위를 벗어나면 에러를 반환해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const userId = 'user1';
      const updateData = { rating: 0 };

      const mockReview = {
        id: reviewId,
        userId,
        productId: 'product1',
      };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);

      // Act & Assert
      await expect(reviewService.updateReview(reviewId, userId, updateData)).rejects.toThrow();
    });
  });

  describe('deleteReview', () => {
    it('본인의 리뷰를 삭제할 수 있어야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const userId = 'user1';

      const mockReview = {
        id: reviewId,
        userId,
        productId: 'product1',
        orderItemId: 'orderItem1',
        rating: 5,
        content: '리뷰',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);
      const deleteSpy = jest.spyOn(reviewRepository, 'delete').mockResolvedValue(undefined as any);
      jest.spyOn(orderItemRepository, 'updateIsReviewed').mockResolvedValue(undefined as any);
      jest.spyOn(productRepository, 'updateProductReviewStats').mockResolvedValue(undefined as any);

      // Act
      await reviewService.deleteReview(reviewId, userId);

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(reviewId);
    });

    it('다른 사용자의 리뷰 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const userId = 'user2';

      const mockReview = {
        id: reviewId,
        userId: 'user1',
        productId: 'product1',
        orderItemId: 'orderItem1',
      };

      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(mockReview as any);

      // Act & Assert
      await expect(reviewService.deleteReview(reviewId, userId)).rejects.toThrow();
    });

    it('존재하지 않는 리뷰 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(reviewRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(reviewService.deleteReview('nonexistent', 'user1')).rejects.toThrow();
    });
  });
});
