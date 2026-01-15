import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UserService - 유닛 테스트', () => {
  let userService: any;
  let userRepository: any;
  let bcrypt: any;

  beforeEach(async () => {
    // 모듈 동적 import
    const userServiceModule = await import('../../services/user.service.js');
    const userRepositoryModule = await import('../../repositories/user.repository.js');
    const bcryptModule = await import('bcrypt');

    userService = userServiceModule.userService;
    userRepository = userRepositoryModule.userRepository;
    bcrypt = bcryptModule.default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getById', () => {
    it('사용자를 ID로 조회할 수 있어야 함', async () => {
      // Arrange
      const userId = 'user1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        type: 'BUYER',
        points: 100,
        gradeId: 'grade1',
        grade: {
          id: 'grade1',
          name: 'Bronze',
          rate: 5,
          minAmount: 0,
        },
        image: { url: 'image.jpg' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'getById').mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.getById(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(userRepository.getById).toHaveBeenCalledWith(userId);
    });

    it('존재하지 않는 사용자 조회 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(userRepository, 'getById').mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('새 사용자를 생성할 수 있어야 함', async () => {
      // Arrange
      const createUserInput = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        type: 'BUYER' as const,
      };

      const mockCreatedUser = {
        id: 'user1',
        email: createUserInput.email,
        name: createUserInput.name,
        type: createUserInput.type,
        points: 0,
        gradeId: 'grade1',
        grade: {
          id: 'grade1',
          name: 'Bronze',
          rate: 5,
          minAmount: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(userRepository, 'create').mockResolvedValue(mockCreatedUser as any);

      // Act
      const result = await userService.create(createUserInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserInput.email);
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('사용자 정보를 수정할 수 있어야 함', async () => {
      // Arrange
      const updateInput = {
        userId: 'user1',
        currentPassword: 'oldpassword',
        name: 'Updated Name',
      };

      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Updated Name',
        type: 'BUYER',
        points: 100,
        gradeId: 'grade1',
        grade: {
          id: 'grade1',
          name: 'Bronze',
          rate: 5,
          minAmount: 0,
        },
        image: { url: 'image.jpg' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'findPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(userRepository, 'update').mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.update(updateInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
    });

    it('잘못된 현재 비밀번호로 수정 시 에러를 반환해야 함', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(
        userService.update({
          userId: 'user1',
          currentPassword: 'wrongpassword',
          name: 'New Name',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getLikeStores', () => {
    it('관심 스토어 목록을 조회할 수 있어야 함', async () => {
      // Arrange
      const userId = 'user1';
      const mockStores = [
        {
          storeId: 'store1',
          userId: userId,
          store: {
            id: 'store1',
            name: 'Store 1',
            image: { url: 'store1.jpg' },
          },
        },
      ];

      jest.spyOn(userRepository, 'getLikeStores').mockResolvedValue(mockStores as any);

      // Act
      const result = await userService.getLikeStores(userId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('서비스 메서드 존재 확인', () => {
    it('delete 메서드가 존재해야 함', () => {
      expect(userService.delete).toBeDefined();
      expect(typeof userService.delete).toBe('function');
    });
  });
});
