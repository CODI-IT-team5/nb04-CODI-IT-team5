/**
 * E2E 테스트용 JWT 토큰 생성 헬퍼
 */
import jwt from 'jsonwebtoken';

import { config } from '../../config/config.js';

/**
 * 테스트용 Access Token 생성
 */
export function generateTestAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.auth.accessTokenSecretKey, {
    expiresIn: config.auth.accessTokenExpiresIn,
  });
}

/**
 * 테스트용 Refresh Token 생성
 */
export function generateTestRefreshToken(userId: string, deviceId: string = 'test-device'): string {
  const jti = `test-jti-${Date.now()}`;
  return jwt.sign({ userId, deviceId, jti }, config.auth.refreshTokenSecretKey, {
    expiresIn: config.auth.refreshTokenExpiresIn,
  });
}

/**
 * 테스트용 만료된 Access Token 생성
 */
export function generateExpiredAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.auth.accessTokenSecretKey, {
    expiresIn: '-1s', // 이미 만료됨
  });
}

/**
 * 테스트용 잘못된 토큰 생성
 */
export function generateInvalidToken(): string {
  return 'invalid.token.here';
}
