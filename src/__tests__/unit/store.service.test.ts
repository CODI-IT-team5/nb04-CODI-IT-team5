import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('StoreService - 유닛 테스트', () => {
  let storeService: any;
  let storeRepository: typeof import('../../repositories/store.repository.js').storeRepository;
  let userRepository: typeof import('../../repositories/user.repository.js').userRepository;

  beforeEach(async () => {
    // 모듈 동적 import
    const storeServiceModule = await import('../../services/store.service.js');
    const storeRepositoryModule = await import('../../repositories/store.repository.js');
    const userRepositoryModule = await import('../../repositories/user.repository.js');

    storeService = storeServiceModule.storeService;
    storeRepository = storeRepositoryModule.storeRepository;
    userRepository = userRepositoryModule.userRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('스토어를 생성해야 함', async () => {
      // Arrange
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'user@test.com',
        type: 'SELLER',
      };

      const mockStore = {
        id: 'store1',
        userId: 'user1',
        name: '테스트 스토어',
        address: '서울시',
        detailAddress: '강남구',
        phoneNumber: '010-1234-5678',
        content: '스토어 설명',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'getById').mockResolvedValue(mockUser as any);
      jest.spyOn(storeRepository, 'findByUserId').mockResolvedValue(null);
      const createSpy = jest.spyOn(storeRepository, 'create').mockResolvedValue(mockStore as any);

      // Act
      const result = await storeService.create({
        userId: 'user1',
        name: '테스트 스토어',
        address: '서울시',
        detailAddress: '강남구',
        phoneNumber: '010-1234-5678',
        content: '스토어 설명',
      });

      // Assert
      expect(createSpy).toHaveBeenCalled();
      expect(result.name).toBe('테스트 스토어');
    });

    it('이미 스토어가 있는 사용자는 스토어를 생성할 수 없음', async () => {
      // Arrange
      const mockUser = { id: 'user1' };
      const existingStore = { id: 'store1', userId: 'user1' };

      jest.spyOn(userRepository, 'getById').mockResolvedValue(mockUser as any);
      jest.spyOn(storeRepository, 'findByUserId').mockResolvedValue(existingStore as any);

      // Act & Assert
      await expect(
        storeService.create({
          userId: 'user1',
          name: '새 스토어',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('스토어 상세 정보를 반환해야 함', async () => {
      // Arrange
      const storeId = 'store1';
      const mockStore = {
        id: storeId,
        name: '테스트 스토어',
        userId: 'user1',
        address: '서울시',
        phoneNumber: '010-1234-5678',
        content: '스토어 설명',
      };

      jest.spyOn(storeRepository, 'findByIdWithDetails').mockResolvedValue(mockStore as any);

      // Act
      const result = await storeService.getById(storeId);

      // Assert
      expect(result.id).toBe(storeId);
      expect(result.name).toBe('테스트 스토어');
    });

    it('존재하지 않는 스토어 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(storeRepository, 'findByIdWithDetails').mockResolvedValue(null);

      // Act & Assert
      await expect(storeService.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('본인의 스토어를 수정할 수 있어야 함', async () => {
      // Arrange
      const storeId = 'store1';
      const userId = 'user1';

      const mockStore = {
        id: storeId,
        userId,
        name: '원래 스토어',
      };

      const mockUpdatedStore = {
        ...mockStore,
        name: '수정된 스토어',
      };

      jest.spyOn(storeRepository, 'findById').mockResolvedValue(mockStore as any);
      const updateSpy = jest.spyOn(storeRepository, 'update').mockResolvedValue(mockUpdatedStore as any);

      // Act
      const result = await storeService.update({
        storeId,
        userId,
        name: '수정된 스토어',
      });

      // Assert
      expect(updateSpy).toHaveBeenCalled();
      expect(result.name).toBe('수정된 스토어');
    });

    it('다른 사용자의 스토어 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      const mockStore = {
        id: 'store1',
        userId: 'user1',
      };

      jest.spyOn(storeRepository, 'findById').mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        storeService.update({
          storeId: 'store1',
          userId: 'user2', // 다른 사용자
          name: '수정',
        }),
      ).rejects.toThrow();
    });
  });

  describe('toggleFavorite', () => {
    it('관심 스토어를 등록할 수 있어야 함', async () => {
      // Arrange
      const storeId = 'store1';
      const userId = 'user1';

      const mockStore = {
        id: storeId,
        name: '테스트 스토어',
      };

      jest.spyOn(storeRepository, 'findById').mockResolvedValue(mockStore as any);
      jest.spyOn(storeRepository, 'toggleFavorite').mockResolvedValue({
        type: 'register' as const,
      });

      // Act
      const result = await storeService.toggleFavorite({
        storeId,
        userId,
      });

      // Assert
      expect(result.type).toBe('register');
      expect(result.store.id).toBe(storeId);
    });

    it('관심 스토어를 해제할 수 있어야 함', async () => {
      // Arrange
      const storeId = 'store1';
      const userId = 'user1';

      const mockStore = {
        id: storeId,
        name: '테스트 스토어',
      };

      jest.spyOn(storeRepository, 'findById').mockResolvedValue(mockStore as any);
      jest.spyOn(storeRepository, 'toggleFavorite').mockResolvedValue({
        type: 'delete' as const,
      });

      // Act
      const result = await storeService.toggleFavorite({
        storeId,
        userId,
      });

      // Assert
      expect(result.type).toBe('delete');
    });
  });
});
