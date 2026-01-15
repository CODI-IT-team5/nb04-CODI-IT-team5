import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { type Express } from 'express';
import request from 'supertest';

describe('InquiryReply API - 통합 테스트', () => {
  let app: Express;
  let inquiryReplyService: typeof import('../../services/inquiry-reply.service.js').default;
  let inquiryReplyController: typeof import('../../controllers/inquiry-reply.controller.js').default;

  beforeEach(async () => {
    // 모듈 동적 import
    const inquiryReplyServiceModule = await import('../../services/inquiry-reply.service.js');
    const inquiryReplyControllerModule = await import('../../controllers/inquiry-reply.controller.js');
    const errorMiddlewareModule = await import('../../middlewares/error.middleware.js');

    inquiryReplyService = inquiryReplyServiceModule.default;
    inquiryReplyController = inquiryReplyControllerModule.default;

    // Express 앱 설정
    app = express();
    app.use(express.json());

    // Mock 인증 미들웨어 - 판매자
    app.use((req, _res, next) => {
      req.user = {
        id: 'test-seller-id',
        email: 'seller@test.com',
        type: 'SELLER',
      };
      next();
    });

    // 라우트 설정
    app.post('/api/inquiries/:inquiryId/replies', inquiryReplyController.createReply.bind(inquiryReplyController));
    app.get('/api/inquiries/:replyId/replies', inquiryReplyController.getReplyById.bind(inquiryReplyController));
    app.patch('/api/inquiries/:replyId/replies', inquiryReplyController.updateReply.bind(inquiryReplyController));
    app.delete('/api/inquiries/:replyId/replies', inquiryReplyController.deleteReply.bind(inquiryReplyController));

    // 에러 미들웨어
    app.use(errorMiddlewareModule.errorMiddleware);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/inquiries/:inquiryId/replies', () => {
    it('답변을 생성해야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const mockReply = {
        id: 'reply1',
        inquiryId,
        userId: 'test-seller-id',
        content: '답변 내용입니다',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryReplyService, 'createReply').mockResolvedValue(mockReply as any);

      // Act
      const response = await request(app).post(`/api/inquiries/${inquiryId}/replies`).send({
        content: '답변 내용입니다',
      });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('답변 내용입니다');
      expect(inquiryReplyService.createReply).toHaveBeenCalledWith(inquiryId, 'test-seller-id', '답변 내용입니다');
    });

    it('존재하지 않는 문의에 답변 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyService, 'createReply').mockRejectedValue(new Error('Not found'));

      // Act
      const response = await request(app).post('/api/inquiries/nonexistent/replies').send({
        content: '답변',
      });

      // Assert
      expect(response.status).toBe(500);
    });

    it('이미 답변이 있는 문의에 답변 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyService, 'createReply').mockRejectedValue(new Error('이미 답변이 등록된 문의입니다.'));

      // Act
      const response = await request(app).post('/api/inquiries/inquiry1/replies').send({
        content: '답변',
      });

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/inquiries/:replyId/replies', () => {
    it('답변 상세 정보를 반환해야 함', async () => {
      // Arrange
      const replyId = 'reply1';
      const mockReply = {
        id: replyId,
        inquiryId: 'inquiry1',
        userId: 'seller1',
        content: '답변 내용',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryReplyService, 'getReplyById').mockResolvedValue(mockReply as any);

      // Act
      const response = await request(app).get(`/api/inquiries/${replyId}/replies`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(replyId);
      expect(response.body.content).toBe('답변 내용');
    });

    it('존재하지 않는 답변 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyService, 'getReplyById').mockRejectedValue(new Error('Not found'));

      // Act
      const response = await request(app).get('/api/inquiries/nonexistent/replies');

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/inquiries/:replyId/replies', () => {
    it('답변을 수정해야 함', async () => {
      // Arrange
      const replyId = 'reply1';
      const mockUpdatedReply = {
        id: replyId,
        inquiryId: 'inquiry1',
        userId: 'test-seller-id',
        content: '수정된 답변',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryReplyService, 'updateReply').mockResolvedValue(mockUpdatedReply as any);

      // Act
      const response = await request(app).patch(`/api/inquiries/${replyId}/replies`).send({
        content: '수정된 답변',
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.content).toBe('수정된 답변');
      expect(inquiryReplyService.updateReply).toHaveBeenCalledWith(replyId, 'test-seller-id', '수정된 답변');
    });

    it('다른 사용자의 답변 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyService, 'updateReply').mockRejectedValue(new Error('본인의 답변만 수정할 수 있습니다.'));

      // Act
      const response = await request(app).patch('/api/inquiries/reply1/replies').send({
        content: '수정',
      });

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/inquiries/:replyId/replies', () => {
    it('답변을 삭제해야 함', async () => {
      // Arrange
      const replyId = 'reply1';
      jest.spyOn(inquiryReplyService, 'deleteReply').mockResolvedValue({} as any);

      // Act
      const response = await request(app).delete(`/api/inquiries/${replyId}/replies`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(inquiryReplyService.deleteReply).toHaveBeenCalledWith(replyId, 'test-seller-id');
    });

    it('다른 사용자의 답변 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyService, 'deleteReply').mockRejectedValue(new Error('본인의 답변만 삭제할 수 있습니다.'));

      // Act
      const response = await request(app).delete('/api/inquiries/reply1/replies');

      // Assert
      expect(response.status).toBe(500);
    });
  });
});
