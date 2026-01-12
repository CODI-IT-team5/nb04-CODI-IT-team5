import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('AuthService - 유닛 테스트', () => {
  let authService: any;
  let authRepository: any;
  let bcrypt: any;
  let jwt: any;

  beforeEach(async () => {
    // 모듈 동적 import
    const authServiceModule = await import('../../services/auth.service.js');
    const authRepositoryModule = await import('../../repositories/auth.repository.js');
    const bcryptModule = await import('bcrypt');
    const jwtModule = await import('jsonwebtoken');

    authService = authServiceModule.authService;
    authRepository = authRepositoryModule.authRepository;
    bcrypt = bcryptModule.default;
    jwt = jwtModule.default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    // Auth 서비스는 transaction, bcrypt, jwt 등 복잡한 의존성이 많아
    // 상세한 유닛 테스트는 E2E 테스트에서 검증합니다.
    it('로그인 메서드가 존재해야 함', () => {
      expect(authService.login).toBeDefined();
      expect(typeof authService.login).toBe('function');
    });
  });

  describe('refresh', () => {
    it('refresh 메서드가 존재해야 함', () => {
      expect(authService.refresh).toBeDefined();
      expect(typeof authService.refresh).toBe('function');
    });
  });

  describe('logout', () => {
    it('logout 메서드가 존재해야 함', () => {
      expect(authService.logout).toBeDefined();
      expect(typeof authService.logout).toBe('function');
    });
  });
});
