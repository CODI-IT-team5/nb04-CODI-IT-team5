import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { type Express } from 'express';
import request from 'supertest';

describe('Review API - 통합 테스트', () => {
  let app: Express;
  let reviewService: typeof import('../../services/review.service.js').default;
  let reviewController: typeof import('../../controllers/review.controller.js').default;

  beforeEach(async () => {
    // 모듈 동적 import
    const reviewServiceModule = await import('../../services/review.service.js');
    const reviewControllerModule = await import('../../controllers/review.controller.js');
    const errorMiddlewareModule = await import('../../middlewares/error.middleware.js');

    reviewService = reviewServiceModule.default;
    reviewController = reviewControllerModule.default;

    // Express 앱 설정
    app = express();
    app.use(express.json());

    // Mock 인증 미들웨어
    app.use((req, _res, next) => {
      req.user = {
        id: 'test-user-id',
        email: 'buyer@test.com',
        type: 'BUYER',
      };
      next();
    });

    // 라우트 설정
    app.post('/api/product/:productId/reviews', reviewController.createReview.bind(reviewController));
    app.get('/api/product/:productId/reviews', reviewController.getProductReviews.bind(reviewController));
    app.get('/api/review/:reviewId', reviewController.getReviewById.bind(reviewController));
    app.patch('/api/review/:reviewId', reviewController.updateReview.bind(reviewController));
    app.delete('/api/review/:reviewId', reviewController.deleteReview.bind(reviewController));

    // 에러 미들웨어
    app.use(errorMiddlewareModule.errorMiddleware);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/product/:productId/reviews', () => {
    it('리뷰를 생성해야 함', async () => {
      // Arrange
      const productId = 'product1';
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: '좋은 상품입니다',
        userId: 'test-user-id',
        productId,
        orderItemId: 'orderItem1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(reviewService, 'createReview').mockResolvedValue(mockReview as any);

      // Act
      const response = await request(app).post(`/api/product/${productId}/reviews`).send({
        rating: 5,
        content: '좋은 상품입니다',
        orderItemId: 'orderItem1',
      });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(5);
      expect(reviewService.createReview).toHaveBeenCalledWith({
        rating: 5,
        content: '좋은 상품입니다',
        userId: 'test-user-id',
        productId,
        orderItemId: 'orderItem1',
      });
    });

    it('잘못된 별점으로 요청 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(reviewService, 'createReview').mockRejectedValue(new Error('별점은 1~5 사이의 값이어야 합니다.'));

      // Act
      const response = await request(app).post('/api/product/product1/reviews').send({
        rating: 6,
        content: '테스트',
        orderItemId: 'orderItem1',
      });

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/product/:productId/reviews', () => {
    const mockProductId = 'product1';
    const mockReviews = [
      {
        id: 'review1',
        rating: 5,
        content: '좋아요',
        userId: 'user1',
        productId: mockProductId,
        orderItemId: 'orderItem1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user1',
          name: 'User 1',
          image: 'user1.jpg',
        },
      },
      {
        id: 'review2',
        rating: 4,
        content: '괜찮아요',
        userId: 'user2',
        productId: mockProductId,
        orderItemId: 'orderItem2',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user2',
          name: 'User 2',
          image: 'user2.jpg',
        },
      },
    ];

    it('상품별 리뷰 목록을 페이지네이션으로 반환해야 함', async () => {
      // Arrange
      jest.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
        reviews: mockReviews as any,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          hasNextPage: false,
        },
      });

      // Act
      const response = await request(app).get(`/api/product/${mockProductId}/reviews`).query({
        page: 1,
        limit: 10,
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
    });

    it('페이지 파라미터가 없으면 기본값을 사용해야 함', async () => {
      // Arrange
      jest.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
        reviews: mockReviews as any,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          hasNextPage: false,
        },
      });

      // Act
      const response = await request(app).get(`/api/product/${mockProductId}/reviews`);

      // Assert
      expect(response.status).toBe(200);
      expect(reviewService.getProductReviews).toHaveBeenCalledWith(mockProductId, 1, 10);
    });
  });

  describe('GET /api/review/:reviewId', () => {
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

      jest.spyOn(reviewService, 'getReviewById').mockResolvedValue(mockReview as any);

      // Act
      const response = await request(app).get(`/api/review/${reviewId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reviewId);
      expect(response.body.rating).toBe(5);
    });

    it('존재하지 않는 리뷰 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(reviewService, 'getReviewById').mockRejectedValue(new Error('Not found'));

      // Act
      const response = await request(app).get('/api/review/nonexistent');

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/review/:reviewId', () => {
    it('리뷰를 수정해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      const mockUpdatedReview = {
        id: reviewId,
        rating: 4,
        content: '수정된 리뷰',
        userId: 'test-user-id',
        productId: 'product1',
        orderItemId: 'orderItem1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(reviewService, 'updateReview').mockResolvedValue(mockUpdatedReview as any);

      // Act
      const response = await request(app).patch(`/api/review/${reviewId}`).send({
        rating: 4,
        content: '수정된 리뷰',
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(4);
      expect(response.body.content).toBe('수정된 리뷰');
      expect(reviewService.updateReview).toHaveBeenCalledWith(reviewId, 'test-user-id', {
        rating: 4,
        content: '수정된 리뷰',
      });
    });
  });

  describe('DELETE /api/review/:reviewId', () => {
    it('리뷰를 삭제해야 함', async () => {
      // Arrange
      const reviewId = 'review1';
      jest.spyOn(reviewService, 'deleteReview').mockResolvedValue(null);

      // Act
      const response = await request(app).delete(`/api/review/${reviewId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(reviewService.deleteReview).toHaveBeenCalledWith(reviewId, 'test-user-id');
    });
  });
});
