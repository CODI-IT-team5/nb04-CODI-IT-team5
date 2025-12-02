import type { CreateRefreshTokenInput } from '../types/auth.type.js';
import prisma from '../utils/prisma.js';

class AuthRepository {
  findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      include: { grade: true },
    });
  };

  createRefreshToken = async (inputData: CreateRefreshTokenInput) => {
    // TODO: 기존 토큰이 있으면 삭제 (추후 토큰 개수 제한으로 변경)
    // await prisma.refreshToken.deleteMany({
    //   where: { userId: createData.userId },
    // });

    // 새 토큰 생성
    return await prisma.refreshToken.create({
      data: {
        token: inputData.token,
        user: { connect: { id: inputData.userId } },
        issuedAt: inputData.issuedAt,
        expiresAt: inputData.expiresAt,
      },
    });
  };
}
export const authRepository = new AuthRepository();
