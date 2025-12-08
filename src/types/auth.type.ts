import type { DeletedTokenReason } from '@prisma/client';
// TODO 이름 통일하기
export interface BaseDevice {
  userId: string;
  userAgent: string | null;
  ip: string | null;
}

export interface BaseRefreshToken {
  jti: string;
  expiresAt: Date;
  issuedAt: Date;
}

export interface updateToken extends BaseRefreshToken {
  lastUsedAt: Date;
}
export interface CreateRefreshTokenInput extends BaseRefreshToken {
  deviceId: string;
}

export interface BaseLogin {
  email: string;
  password: string;
}

export interface LoginData extends BaseLogin {
  userAgent: string | null;
  ip: string | null;
}

export interface DeleteRefreshTokenData {
  jti: string;
  reason: DeletedTokenReason;
}

export interface DeleteRefreshTokenDataByDeviceId {
  deviceId: string;
  reason: DeletedTokenReason;
}
export interface loginUpdateData {
  userId: string;
  deviceId: string;
}

export interface AccessTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface refreshTokenPayload {
  userId: string;
  deviceId: string;
  jti: string;
  iat: number;
  exp: number;
}
