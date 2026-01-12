import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InquiryStatus } from '@prisma/client';
import express, { type Express } from 'express';
import request from 'supertest';

describe('Inquiry API - 통합 테스트', () => {
  let app: Express;
  let inquiryService: typeof import('../../services/inquiry.service.js').default;
  let inquiryController: typeof import('../../controllers/inquiry.controller.js').default;

  beforeEach(async () => {
    // 모듈 동적 import
    const inquiryServiceModule = await import('../../services/inquiry.service.js');
    const inquiryControllerModule = await import('../../controllers/inquiry.controller.js');
    const errorMiddlewareModule = await import('../../middlewares/error.middleware.js');

    inquiryService = inquiryServiceModule.default;
    inquiryController = inquiryControllerModule.default;

    // Express 앱 설정
    app = express();
    app.use(express.json());

    // Mock 인증 미들웨어 - 테스트용 사용자 정보 주입
    app.use((req, _res, next) => {
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        type: 'BUYER',
      };
      next();
    });

    // 라우트 설정
    app.get('/api/products/:productId/inquiries', inquiryController.getProductInquiries.bind(inquiryController));

    // 에러 미들웨어
    app.use(errorMiddlewareModule.errorMiddleware);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/products/:productId/inquiries', () => {
    const mockProductId = 'product123';
    const mockInquiries = [
      {
        id: 'inquiry1',
        title: '문의 1',
        content: '내용 1',
        isSecret: false,
        status: InquiryStatus.WaitingAnswer,
        userId: 'user1',
        productId: mockProductId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: { id: 'user1', name: 'User 1' },
        reply: null,
      },
      {
        id: 'inquiry2',
        title: '문의 2',
        content: '내용 2',
        isSecret: false,
        status: InquiryStatus.CompletedAnswer,
        userId: 'user2',
        productId: mockProductId,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: { id: 'user2', name: 'User 2' },
        reply: { id: 'reply1', content: '답변 1' },
      },
    ];

    it('기본 페이지네이션으로 문의 목록을 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: mockInquiries as any,
        totalCount: 2,
      });

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(2);
      expect(response.body.list).toHaveLength(2);
      expect(response.body.list[0].id).toBe('inquiry1');
      expect(response.body.list[1].id).toBe('inquiry2');
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith(mockProductId, 1, 10, undefined, undefined);
    });

    it('page와 pageSize 파라미터를 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [mockInquiries[0]] as any,
        totalCount: 10,
      });

      // Act
      const response = await request(app)
        .get(`/api/products/${mockProductId}/inquiries`)
        .query({ page: '2', pageSize: '5' });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith(mockProductId, 2, 5, undefined, undefined);
    });

    it('order 파라미터를 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: mockInquiries as any,
        totalCount: 2,
      });

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`).query({ order: 'asc' });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith(mockProductId, 1, 10, 'asc', undefined);
    });

    it('status 파라미터를 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [mockInquiries[0]] as any,
        totalCount: 1,
      });

      // Act
      const response = await request(app)
        .get(`/api/products/${mockProductId}/inquiries`)
        .query({ status: 'WaitingAnswer' });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith(mockProductId, 1, 10, undefined, 'WaitingAnswer');
    });

    it('모든 쿼리 파라미터를 조합해서 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [] as any,
        totalCount: 0,
      });

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`).query({
        page: '3',
        pageSize: '20',
        order: 'asc',
        status: 'CompletedAnswer',
      });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith(mockProductId, 3, 20, 'asc', 'CompletedAnswer');
    });

    it('올바른 응답 형식을 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: mockInquiries as any,
        totalCount: 2,
      });

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('list');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.list)).toBe(true);
      expect(typeof response.body.totalCount).toBe('number');
    });

    it('빈 결과를 올바르게 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [] as any,
        totalCount: 0,
      });

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        list: [],
        totalCount: 0,
      });
    });

    it('서비스 에러 발생 시 적절히 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockRejectedValue(new Error('서비스 에러'));

      // Act
      const response = await request(app).get(`/api/products/${mockProductId}/inquiries`);

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('페이지네이션 엣지 케이스', () => {
    it('page가 0인 경우를 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [] as any,
        totalCount: 0,
      });

      // Act
      const response = await request(app).get('/api/products/product123/inquiries').query({ page: '0' });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith('product123', 0, 10, undefined, undefined);
    });

    it('pageSize가 매우 큰 경우를 처리해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [] as any,
        totalCount: 0,
      });

      // Act
      const response = await request(app).get('/api/products/product123/inquiries').query({ pageSize: '1000' });

      // Assert
      expect(response.status).toBe(200);
      expect(inquiryService.getProductInquiries).toHaveBeenCalledWith('product123', 1, 1000, undefined, undefined);
    });

    it('order 값이 asc/desc가 아닌 경우 그대로 전달해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryService, 'getProductInquiries').mockResolvedValue({
        inquiries: [] as any,
        totalCount: 0,
      });

      // Act
      const response = await request(app).get('/api/products/product123/inquiries').query({ order: 'invalid' });

      // Assert
      expect(response.status).toBe(200);
      // Controller가 그대로 전달하고, Service/Repository에서 처리
      expect(inquiryService.getProductInquiries).toHaveBeenCalled();
    });
  });
});
