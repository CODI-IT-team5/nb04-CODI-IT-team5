import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InquiryStatus } from '@prisma/client';

describe('InquiryReplyService - 유닛 테스트', () => {
  let inquiryReplyService: typeof import('../../services/inquiry-reply.service.js').default;
  let inquiryRepository: typeof import('../../repositories/inquiry.repository.js').default;
  let inquiryReplyRepository: typeof import('../../repositories/inquiry-reply.repository.js').default;
  let storeRepository: typeof import('../../repositories/store.repository.js').storeRepository;

  beforeEach(async () => {
    // 모듈 동적 import
    const inquiryReplyServiceModule = await import('../../services/inquiry-reply.service.js');
    const inquiryRepositoryModule = await import('../../repositories/inquiry.repository.js');
    const inquiryReplyRepositoryModule = await import('../../repositories/inquiry-reply.repository.js');
    const storeRepositoryModule = await import('../../repositories/store.repository.js');

    inquiryReplyService = inquiryReplyServiceModule.default;
    inquiryRepository = inquiryRepositoryModule.default;
    inquiryReplyRepository = inquiryReplyRepositoryModule.default;
    storeRepository = storeRepositoryModule.storeRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createReply', () => {
    it('답변을 생성해야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const userId = 'seller1';
      const content = '답변 내용입니다';

      const mockInquiry = {
        id: inquiryId,
        userId: 'buyer1',
        productId: 'product1',
        status: InquiryStatus.WaitingAnswer,
        product: {
          storeId: 'store1',
        },
      };

      const mockStore = {
        id: 'store1',
        userId: userId,
      };

      const mockReply = {
        id: 'reply1',
        inquiryId,
        userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);
      jest.spyOn(storeRepository, 'findByUserId').mockResolvedValue(mockStore as any);
      jest.spyOn(inquiryReplyRepository, 'findByInquiryId').mockResolvedValue(null);
      const createSpy = jest.spyOn(inquiryReplyRepository, 'create').mockResolvedValue(mockReply as any);
      jest.spyOn(inquiryRepository, 'updateStatus').mockResolvedValue({} as any);

      // Act
      const result = await inquiryReplyService.createReply(inquiryId, userId, content);

      // Assert
      expect(createSpy).toHaveBeenCalledWith({
        content,
        inquiryId,
        userId,
      });
      expect(result).toEqual(mockReply);
    });

    it('존재하지 않는 문의에 답변 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(inquiryReplyService.createReply('nonexistent', 'seller1', '답변')).rejects.toThrow();
    });

    it('다른 스토어의 상품 문의에 답변 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockInquiry = {
        id: 'inquiry1',
        product: {
          storeId: 'store1',
        },
      };

      const mockStore = {
        id: 'store2', // 다른 스토어
        userId: 'seller1',
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);
      jest.spyOn(storeRepository, 'findByUserId').mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(inquiryReplyService.createReply('inquiry1', 'seller1', '답변')).rejects.toThrow();
    });

    it('이미 답변이 등록된 문의에 답변 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockInquiry = {
        id: 'inquiry1',
        product: {
          storeId: 'store1',
        },
      };

      const mockStore = {
        id: 'store1',
        userId: 'seller1',
      };

      const existingReply = {
        id: 'reply1',
        inquiryId: 'inquiry1',
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);
      jest.spyOn(storeRepository, 'findByUserId').mockResolvedValue(mockStore as any);
      jest.spyOn(inquiryReplyRepository, 'findByInquiryId').mockResolvedValue(existingReply as any);

      // Act & Assert
      await expect(inquiryReplyService.createReply('inquiry1', 'seller1', '답변')).rejects.toThrow();
    });
  });

  describe('getReplyById', () => {
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

      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(mockReply as any);

      // Act
      const result = await inquiryReplyService.getReplyById(replyId);

      // Assert
      expect(result).toEqual(mockReply);
    });

    it('존재하지 않는 답변 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(inquiryReplyService.getReplyById('nonexistent')).rejects.toThrow();
    });
  });

  describe('updateReply', () => {
    it('본인의 답변을 수정할 수 있어야 함', async () => {
      // Arrange
      const replyId = 'reply1';
      const userId = 'seller1';
      const content = '수정된 답변';

      const mockReply = {
        id: replyId,
        userId,
        inquiryId: 'inquiry1',
        content: '원래 답변',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedReply = { ...mockReply, content };

      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(mockReply as any);
      const updateSpy = jest.spyOn(inquiryReplyRepository, 'update').mockResolvedValue(mockUpdatedReply as any);

      // Act
      const result = await inquiryReplyService.updateReply(replyId, userId, content);

      // Assert
      expect(updateSpy).toHaveBeenCalledWith(replyId, { content });
      expect(result).toEqual(mockUpdatedReply);
    });

    it('다른 사용자의 답변 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockReply = {
        id: 'reply1',
        userId: 'seller1',
      };

      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(mockReply as any);

      // Act & Assert
      await expect(inquiryReplyService.updateReply('reply1', 'seller2', '수정')).rejects.toThrow();
    });
  });

  describe('deleteReply', () => {
    it('본인의 답변을 삭제할 수 있어야 함', async () => {
      // Arrange
      const replyId = 'reply1';
      const userId = 'seller1';

      const mockReply = {
        id: replyId,
        userId,
        inquiryId: 'inquiry1',
        content: '답변',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(mockReply as any);
      const deleteSpy = jest.spyOn(inquiryReplyRepository, 'delete').mockResolvedValue(mockReply as any);
      jest.spyOn(inquiryRepository, 'updateStatus').mockResolvedValue({} as any);

      // Act
      await inquiryReplyService.deleteReply(replyId, userId);

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(replyId);
    });

    it('다른 사용자의 답변 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockReply = {
        id: 'reply1',
        userId: 'seller1',
      };

      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(mockReply as any);

      // Act & Assert
      await expect(inquiryReplyService.deleteReply('reply1', 'seller2')).rejects.toThrow();
    });

    it('존재하지 않는 답변 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(inquiryReplyRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(inquiryReplyService.deleteReply('nonexistent', 'seller1')).rejects.toThrow();
    });
  });
});
