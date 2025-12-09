import { DeletedTokenReason } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config/config.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { BaseDevice, BaseLogin, LoginData, loginUpdateData } from '../types/auth.type.js';
import { HttpException } from '../utils/http-exception.js';

class AuthService {
  login = async (inputData: LoginData) => {
    const { email, password, userAgent, ip } = inputData;

    const user = await verifyUser({ email, password }); // 유저 찾기, 비밀번호 비교
    const device = await findOrCreateDevice({ userId: user.id, userAgent, ip }); // 기기 찾기 또는 만들기
    const tokens = await generateTokens({ userId: user.id, deviceId: device.id }); // 엑세스 토큰 만들기

    await authRepository.createRefreshToken({
      jti: tokens.jti,
      deviceId: device.id,
      issuedAt: tokens.refreshTokenIssuedAt,
      expiresAt: tokens.refreshTokenExpiresAt,
    });
    await authRepository.login({
      deviceId: device.id,
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.points,
        image: user.image,
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
const findOrCreateDevice = async (data: BaseDevice) => {
  const { userId, userAgent, ip } = data;
  let device = await authRepository.findDeviceByUserAgent({ userId, userAgent, ip });
  if (!device) {
    await deviceLimit(userId);
    device = await authRepository.createDevice({ userId, userAgent, ip });
    return device;
  }

  await authRepository.deleteRefreshTokenByDeviceId({ deviceId: device.id, reason: DeletedTokenReason.REPLACED });
  return device;
};

const deviceLimit = async (userId: string) => {
  const count = await authRepository.findDeviceCount(userId);
  if (count < config.auth.maxDevice) return;

  const oldestDevice = await authRepository.findLastUsedDevice(userId);
  if (!oldestDevice) throw HttpException.notFound();

  await authRepository.deleteDevice(oldestDevice.id);

  const token = oldestDevice.refreshTokens?.[0];
  if (token) {
    await authRepository.deleteRefreshToken({
      jti: token.jti,
      reason: DeletedTokenReason.DEVICE_LIMIT,
    });
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
