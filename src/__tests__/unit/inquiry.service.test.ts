import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InquiryStatus } from '@prisma/client';

describe('InquiryService - 유닛 테스트', () => {
  let inquiryService: typeof import('../../services/inquiry.service.js').default;
  let inquiryRepository: typeof import('../../repositories/inquiry.repository.js').default;
  let productRepository: typeof import('../../repositories/product.repository.js').productRepository;

  beforeEach(async () => {
    // 모듈 동적 import
    const inquiryServiceModule = await import('../../services/inquiry.service.js');
    const inquiryRepositoryModule = await import('../../repositories/inquiry.repository.js');
    const productRepositoryModule = await import('../../repositories/product.repository.js');

    inquiryService = inquiryServiceModule.default;
    inquiryRepository = inquiryRepositoryModule.default;
    productRepository = productRepositoryModule.productRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProductInquiries - 페이지네이션 테스트', () => {
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

    it('페이지네이션된 문의 목록을 반환해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId, name: 'Product 1' };
      const findByIdSpy = jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const findByProductIdWithPaginationSpy = jest
        .spyOn(inquiryRepository, 'findByProductIdWithPagination')
        .mockResolvedValue({
          inquiries: mockInquiries as any,
          totalCount: 2,
        });

      // Act
      const result = await inquiryService.getProductInquiries(mockProductId, 1, 10);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(mockProductId);
      expect(findByProductIdWithPaginationSpy).toHaveBeenCalledWith({
        productId: mockProductId,
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual({
        inquiries: mockInquiries,
        totalCount: 2,
      });
    });

    it('페이지 번호와 크기를 전달해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const findByProductIdWithPaginationSpy = jest
        .spyOn(inquiryRepository, 'findByProductIdWithPagination')
        .mockResolvedValue({
          inquiries: [mockInquiries[0]] as any,
          totalCount: 10,
        });

      // Act
      await inquiryService.getProductInquiries(mockProductId, 2, 5);

      // Assert
      expect(findByProductIdWithPaginationSpy).toHaveBeenCalledWith({
        productId: mockProductId,
        page: 2,
        pageSize: 5,
      });
    });

    it('정렬 순서를 전달해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const findByProductIdWithPaginationSpy = jest
        .spyOn(inquiryRepository, 'findByProductIdWithPagination')
        .mockResolvedValue({
          inquiries: mockInquiries as any,
          totalCount: 2,
        });

      // Act
      await inquiryService.getProductInquiries(mockProductId, 1, 10, 'asc');

      // Assert
      expect(findByProductIdWithPaginationSpy).toHaveBeenCalledWith({
        productId: mockProductId,
        page: 1,
        pageSize: 10,
        order: 'asc',
      });
    });

    it('상태 필터를 전달해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const findByProductIdWithPaginationSpy = jest
        .spyOn(inquiryRepository, 'findByProductIdWithPagination')
        .mockResolvedValue({
          inquiries: [mockInquiries[0]] as any,
          totalCount: 1,
        });

      // Act
      await inquiryService.getProductInquiries(mockProductId, 1, 10, 'desc', InquiryStatus.WaitingAnswer);

      // Assert
      expect(findByProductIdWithPaginationSpy).toHaveBeenCalledWith({
        productId: mockProductId,
        page: 1,
        pageSize: 10,
        order: 'desc',
        status: InquiryStatus.WaitingAnswer,
      });
    });

    it('존재하지 않는 상품 ID로 요청 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(inquiryService.getProductInquiries('nonexistent', 1, 10)).rejects.toThrow();
    });

    it('기본값으로 page=1, pageSize=10을 사용해야 함', async () => {
      // Arrange
      const mockProduct = { id: mockProductId };
      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const findByProductIdWithPaginationSpy = jest
        .spyOn(inquiryRepository, 'findByProductIdWithPagination')
        .mockResolvedValue({
          inquiries: mockInquiries as any,
          totalCount: 2,
        });

      // Act
      await inquiryService.getProductInquiries(mockProductId);

      // Assert
      expect(findByProductIdWithPaginationSpy).toHaveBeenCalledWith({
        productId: mockProductId,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('createInquiry', () => {
    it('문의를 생성해야 함', async () => {
      // Arrange
      const mockInquiryData = {
        title: '새 문의',
        content: '문의 내용',
        isSecret: false,
        userId: 'user1',
        productId: 'product1',
      };

      const mockProduct = { id: 'product1', name: 'Product 1' };
      const mockCreatedInquiry = {
        id: 'inquiry1',
        ...mockInquiryData,
        status: InquiryStatus.WaitingAnswer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct as any);
      const createSpy = jest.spyOn(inquiryRepository, 'create').mockResolvedValue(mockCreatedInquiry as any);

      // Act
      const result = await inquiryService.createInquiry(mockInquiryData);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(mockInquiryData);
      expect(result).toEqual(mockCreatedInquiry);
    });
  });

  describe('updateInquiry', () => {
    it('본인의 문의를 수정할 수 있어야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const userId = 'user1';
      const updateData = { title: '수정된 제목', content: '수정된 내용' };

      const mockInquiry = {
        id: inquiryId,
        userId,
        status: InquiryStatus.WaitingAnswer,
        title: '원래 제목',
        content: '원래 내용',
        isSecret: false,
        productId: 'product1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedInquiry = { ...mockInquiry, ...updateData };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);
      const updateSpy = jest.spyOn(inquiryRepository, 'update').mockResolvedValue(mockUpdatedInquiry as any);

      // Act
      const result = await inquiryService.updateInquiry(inquiryId, userId, updateData);

      // Assert
      expect(updateSpy).toHaveBeenCalledWith(inquiryId, updateData);
      expect(result).toEqual(mockUpdatedInquiry);
    });

    it('다른 사용자의 문의 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const userId = 'user2';
      const updateData = { title: '수정된 제목' };

      const mockInquiry = {
        id: inquiryId,
        userId: 'user1',
        status: InquiryStatus.WaitingAnswer,
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);

      // Act & Assert
      await expect(inquiryService.updateInquiry(inquiryId, userId, updateData)).rejects.toThrow();
    });
  });

  describe('deleteInquiry', () => {
    it('본인의 문의를 삭제할 수 있어야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const userId = 'user1';

      const mockInquiry = {
        id: inquiryId,
        userId,
        title: '문의',
        content: '내용',
        isSecret: false,
        status: InquiryStatus.WaitingAnswer,
        productId: 'product1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);
      const deleteSpy = jest.spyOn(inquiryRepository, 'delete').mockResolvedValue(mockInquiry as any);

      // Act
      await inquiryService.deleteInquiry(inquiryId, userId, 'BUYER');

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(inquiryId);
    });

    it('다른 사용자의 문의 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      const inquiryId = 'inquiry1';
      const userId = 'user2';

      const mockInquiry = {
        id: inquiryId,
        userId: 'user1',
      };

      jest.spyOn(inquiryRepository, 'findById').mockResolvedValue(mockInquiry as any);

      // Act & Assert
      await expect(inquiryService.deleteInquiry(inquiryId, userId, 'BUYER')).rejects.toThrow();
    });
  });
});
