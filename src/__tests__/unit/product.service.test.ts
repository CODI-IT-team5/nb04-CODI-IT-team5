import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('ProductService - 유닛 테스트', () => {
  let productService: any;
  let productRepository: typeof import('../../repositories/product.repository.js').productRepository;
  let _storeRepository: typeof import('../../repositories/store.repository.js').storeRepository;
  let _metadataRepository: typeof import('../../repositories/metadata.repository.js').metadataRepository;

  beforeEach(async () => {
    // 모듈 동적 import
    const productServiceModule = await import('../../services/product.service.js');
    const productRepositoryModule = await import('../../repositories/product.repository.js');
    const storeRepositoryModule = await import('../../repositories/store.repository.js');
    const metadataRepositoryModule = await import('../../repositories/metadata.repository.js');

    productService = productServiceModule.default;
    productRepository = productRepositoryModule.productRepository;
    _storeRepository = storeRepositoryModule.storeRepository;
    _metadataRepository = metadataRepositoryModule.metadataRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getById', () => {
    it('상품 상세 정보를 반환해야 함', async () => {
      // Arrange
      const productId = 'product1';
      const mockProduct = {
        id: productId,
        name: '테스트 상품',
        price: 10000,
        content: '상품 설명',
        storeId: 'store1',
        categoryId: 'category1',
        isSoldOut: false,
        salesCount: 0,
        reviewCount: 0,
        reviewSum: 0,
        discountRate: 0,
        discountStartTime: null,
        discountEndTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: { url: 'image.jpg' },
        store: { id: 'store1', name: 'Store 1', userId: 'user1' },
        category: { id: 'category1', name: 'TOP' },
        stocks: [],
        reviews: [],
        inquiries: [],
      };

      jest.spyOn(productRepository, 'findByIdWithRelations').mockResolvedValue(mockProduct as any);

      // Act
      const result = await productService.getById(productId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(productId);
      expect(result.name).toBe('테스트 상품');
    });

    it('존재하지 않는 상품 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(productRepository, 'findByIdWithRelations').mockResolvedValue(null);

      // Act & Assert
      await expect(productService.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('getList', () => {
    it('상품 목록을 반환해야 함', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 'product1',
          name: '상품 1',
          price: 10000,
          storeId: 'store1',
          salesCount: 5,
          productDiscounts: [],
          store: { id: 'store1', name: 'Store 1' },
        },
        {
          id: 'product2',
          name: '상품 2',
          price: 20000,
          storeId: 'store1',
          salesCount: 3,
          productDiscounts: [],
          store: { id: 'store1', name: 'Store 1' },
        },
      ];

      jest.spyOn(productRepository, 'findMany').mockResolvedValue({
        products: mockProducts as any,
        totalCount: 2,
      });

      // Act
      const result = await productService.getList({ filters: {} });

      // Assert
      expect(result.list).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('필터링된 상품 목록을 반환해야 함', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 'product1',
          name: '상품 1',
          price: 10000,
          storeId: 'store1',
          salesCount: 5,
          productDiscounts: [],
          store: { id: 'store1', name: 'Store 1' },
        },
      ];

      jest.spyOn(productRepository, 'findMany').mockResolvedValue({
        products: mockProducts as any,
        totalCount: 1,
      });

      // Act
      const result = await productService.getList({
        filters: { category: 'TOP' },
      });

      // Assert
      expect(result.list).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('delete', () => {
    it('본인의 상품을 삭제할 수 있어야 함', async () => {
      // Arrange
      const productId = 'product1';
      const userId = 'user1';

      const mockProduct = {
        id: productId,
        storeId: 'store1',
        store: {
          userId: userId,
        },
      };

      jest.spyOn(productRepository, 'findByIdWithStoreOwner').mockResolvedValue(mockProduct as any);
      const deleteSpy = jest.spyOn(productRepository, 'delete').mockResolvedValue(undefined as any);

      // Act
      await productService.delete({ productId, userId });

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(productId);
    });

    it('다른 사용자의 상품 삭제 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockProduct = {
        id: 'product1',
        storeId: 'store1',
        store: {
          userId: 'user1',
        },
      };

      jest.spyOn(productRepository, 'findByIdWithStoreOwner').mockResolvedValue(mockProduct as any);

      // Act & Assert
      await expect(
        productService.delete({
          productId: 'product1',
          userId: 'user2', // 다른 사용자
        }),
      ).rejects.toThrow();
    });
  });
});
