import { DeletedTokenReason } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config/config.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { BaseDevice, BaseLogin, LoginData, loginUpdateData } from '../types/auth.type.js';
import { HttpException } from '../utils/http-exception.js';
import prisma, { type ExtendedTransactionClient } from '../utils/prisma.js';

class AuthService {
  login = async (input: LoginData) => {
    const user = await verifyUser({ email: input.email, password: input.password }); // 유저 찾기, 비밀번호 비교

    const tokens = await prisma.$transaction(async (tx) => {
      const device = await findOrCreateDevice({ userId: user.id, userAgent: input.userAgent, ip: input.ip }, tx); // 기기 찾기 또는 만들기
      const tokens = await generateTokens({ userId: user.id, deviceId: device.id }); // 엑세스 토큰 만들기

      await authRepository.createRefreshToken(
        {
          jti: tokens.jti,
          deviceId: device.id,
          issuedAt: tokens.refreshTokenIssuedAt,
          expiresAt: tokens.refreshTokenExpiresAt,
        },
        tx,
      );
      await authRepository.login({ deviceId: device.id, userId: user.id }, tx);
      return tokens;
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.points,
        image: user.image.url,
        grade: {
          id: user.grade.id,
          name: user.grade.name,
          rate: user.grade.rate,
          minAmount: user.grade.minAmount,
        },
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  };

  refresh = async (refreshToken: string) => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.auth.refreshTokenSecretKey);
    } catch {
      throw HttpException.tokenError();
    }
    if (!decoded || typeof decoded === 'string' || !decoded.jti) {
      throw HttpException.tokenError();
    }
    const storedRefreshToken = await authRepository.findRefreshTokenByJti(decoded.jti);

    if (!storedRefreshToken) {
      throw HttpException.notFound();
    }

    const newAccessToken = jwt.sign({ userId: decoded.userId }, config.auth.accessTokenSecretKey, {
      expiresIn: config.auth.accessTokenExpiresIn,
    });
    return { accessToken: newAccessToken };
  };

  logout = async (refreshToken: string) => {
    const decoded = jwt.verify(refreshToken, config.auth.refreshTokenSecretKey);
    if (!decoded || typeof decoded === 'string' || !decoded.jti) {
      throw HttpException.tokenError();
    }
    const data = {
      jti: decoded.jti,
      reason: DeletedTokenReason.LOGOUT,
    };
    return await authRepository.deleteRefreshToken(data);
  };
}

export const authService = new AuthService();

// 이메일 확인 및 비밀번호 검증
const verifyUser = async (data: BaseLogin) => {
  const user = await authRepository.findUserByEmail(data.email);
  if (!user) throw HttpException.unauthorized();
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw HttpException.unauthorized();
  }
  return user;
};

// 디바이스 찾기 또는 생성
const findOrCreateDevice = async (input: BaseDevice, tx: ExtendedTransactionClient) => {
  const { userId, userAgent, ip } = input;
  const device = await authRepository.findDeviceByUserAgent({ userId, userAgent, ip }, tx);

  if (!device) {
    await deviceLimit(userId, tx);
    const newDevice = await authRepository.createDevice({ userId, userAgent, ip }, tx);
    return newDevice;
  }

  const activeToken = device.refreshTokens[0];
  if (activeToken?.jti) {
    await authRepository.deleteRefreshTokenWithTx(
      {
        jti: activeToken.jti,
        reason: DeletedTokenReason.REPLACED,
      },
      tx,
    );
  }
  return device;
};

const deviceLimit = async (userId: string, tx: ExtendedTransactionClient) => {
  const count = await authRepository.findDeviceCount(userId, tx);
  if (count < config.auth.maxDevice) return;

  const oldestDevice = await authRepository.findLastUsedDevice(userId);
  if (!oldestDevice) throw HttpException.notFound();

  await authRepository.deleteDevice(oldestDevice.id, tx);

  const token = oldestDevice.refreshTokens?.[0];
  if (token) {
    await authRepository.deleteRefreshTokenWithTx(
      {
        jti: token.jti,
        reason: DeletedTokenReason.DEVICE_LIMIT,
      },
      tx,
    );
  }
};

// 토큰 생성
const generateTokens = async (data: loginUpdateData) => {
  const { userId, deviceId } = data;
  const jti = uuidv4();

  const accessToken = jwt.sign({ userId }, config.auth.accessTokenSecretKey, {
    expiresIn: config.auth.accessTokenExpiresIn,
  });
  const refreshToken = jwt.sign({ userId, deviceId, jti }, config.auth.refreshTokenSecretKey, {
    expiresIn: config.auth.refreshTokenExpiresIn,
  });

  const decoded = jwt.decode(refreshToken) as { exp: number; iat: number } | null;
  if (!decoded || !decoded.exp) throw HttpException.tokenError();

  return {
    accessToken,
    refreshToken,
    jti,
    refreshTokenIssuedAt: new Date(decoded.iat * 1000),
    refreshTokenExpiresAt: new Date(decoded.exp * 1000),
  };
};
