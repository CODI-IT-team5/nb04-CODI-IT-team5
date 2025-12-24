import type {
  BaseDevice,
  CreateRefreshTokenInput,
  DeleteRefreshTokenData,
  loginUpdateData,
} from '../types/auth.type.js';
import prisma, { type ExtendedDeleteArgs, type ExtendedTransactionClient } from '../utils/prisma.js';

class AuthRepository {
  login = async (input: loginUpdateData, tx: ExtendedTransactionClient) => {
    await tx.user.update({
      where: { id: input.userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
    await tx.device.update({
      where: { id: input.deviceId },
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

  findDeviceByUserAgent = async (input: BaseDevice, tx: ExtendedTransactionClient) => {
    return await tx.device.findFirst({
      where: {
        userId: input.userId,
        userAgent: input.userAgent ?? 'unknown', // TODO: unknown 나중에 한 번 더 고민해보기
      },
      include: { refreshTokens: true },
    });
  };

  findDeviceCount = async (userId: string, tx: ExtendedTransactionClient) => {
    return await tx.device.count({
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

  deleteDevice = async (deviceId: string, tx: ExtendedTransactionClient) => {
    return await tx.device.delete({
      where: { id: deviceId },
    });
  };

  createDevice = async (input: BaseDevice, tx: ExtendedTransactionClient) => {
    return await tx.device.create({
      data: {
        user: { connect: { id: input.userId } },
        userAgent: input.userAgent ?? 'unknown',
        ip: input.ip,
        lastUsedAt: new Date(),
      },
    });
  };

  createRefreshToken = async (input: CreateRefreshTokenInput, tx: ExtendedTransactionClient) => {
    // 새 토큰 생성
    return await tx.refreshToken.create({
      data: {
        jti: input.jti,
        device: { connect: { id: input.deviceId } },
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
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
      where: { jti: inputData.jti },
      reason: inputData.reason,
    } as ExtendedDeleteArgs<Parameters<typeof prisma.refreshToken.delete>[0]>);
  };

  deleteRefreshTokenWithTx = async (inputData: DeleteRefreshTokenData, tx: ExtendedTransactionClient) => {
    return await tx.refreshToken.delete({
      where: { jti: inputData.jti },
      reason: inputData.reason,
    } as ExtendedDeleteArgs<Parameters<typeof prisma.refreshToken.delete>[0]>);
  };
}

export const authRepository = new AuthRepository();
