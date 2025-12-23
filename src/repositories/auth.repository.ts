
import type {
  BaseDevice,
  CreateRefreshTokenInput,
  DeleteRefreshTokenData,
  loginUpdateData
} from '../types/auth.type.js';
import prisma from '../utils/prisma.js';

class AuthRepository {
  login = async (data: loginUpdateData) => {
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
    await prisma.device.update({
      where: { id: data.deviceId },
      data: {
        lastUsedAt: new Date(),
      },
    });
    return;
  };

  findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      include: { grade: true },
    });
  };

  findUserById = async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  };

  findDeviceByUserAgent = async (data: BaseDevice) => {
    return await prisma.device.findFirst({
      where: {
        userId: data.userId,
        userAgent: data.userAgent ?? 'unknown', // TODO: unknown 나중에 한 번 더 고민해보기
      },
      include: { refreshTokens: true }
    });
  };

  findDeviceCount = async (userId: string) => {
    return await prisma.device.count({
      where: { userId },
    });
  };

  findLastUsedDevice = async (userId: string) => {
    return await prisma.device.findFirst({
      where: { userId },
      orderBy: { lastUsedAt: 'asc' },
      take: 1,
      include: {
        refreshTokens: {
          orderBy: { issuedAt: 'desc' },
          take: 1,
        },
      },
    });
  };

  deleteDevice = async (deviceId: string) => {
    return await prisma.device.delete({
      where: { id: deviceId },
    });
  };

  createDevice = async (data: BaseDevice) => {
    return await prisma.device.create({
      data: {
        user: { connect: { id: data.userId } },
        userAgent: data.userAgent ?? 'unknown',
        ip: data.ip,
        lastUsedAt: new Date(),
      },
    });
  };

  createRefreshToken = async (inputData: CreateRefreshTokenInput) => {
    // 새 토큰 생성
    return await prisma.refreshToken.create({
      data: {
        jti: inputData.jti,
        device: { connect: { id: inputData.deviceId } },
        issuedAt: inputData.issuedAt,
        expiresAt: inputData.expiresAt,
        lastUsedAt: new Date(),
      },
    });
  };

  findRefreshTokenByJti = async (jti: string) => {
    return await prisma.refreshToken.findFirst({
      where: {
        jti,
      },
    });
  };

  findRefreshTokenByDeviceId = async (id: string) => {
    return await prisma.device.findFirst({
      where: {
        id,
      },
      include: {
        refreshTokens: true,
      },
    });
  };

  findUserByDeviceId = async (deviceId: string) => {
    return await prisma.device.findFirst({
      where: { id: deviceId },
      include: { user: true },
    });
  };

  deleteRefreshToken = async (inputData: DeleteRefreshTokenData) => {
    return await prisma.refreshToken.delete({
      where: { jti: inputData.jti, },
      reason: inputData.reason,
    })
  }
}

export const authRepository = new AuthRepository();
