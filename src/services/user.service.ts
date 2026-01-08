import { DeletedTokenReason, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

import { config } from '../config/config.js';
import { MESSAGE } from '../constants/constant.js';
import { type createUser } from '../dtos/user.dto.js';
import { authRepository } from '../repositories/auth.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { UserResponse } from '../serializes/user.serialize.js';
import type { deleteUser, UpdateUserInput } from '../types/user.type.js';
import { HttpException } from '../utils/http-exception.js';
import prisma from '../utils/prisma.js';

class UserService {
  getById = async (userId: string) => {
    const user = await userRepository.getById(userId);
    if (!user) throw HttpException.userNotFound();
    return UserResponse.baseWithImage(user);
  };

  create = async (input: createUser) => {
    try {
      const hashedPassword = await bcrypt.hash(input.password, config.app.bcryptSaltRounds);
      const user = await userRepository.create({ ...input, password: hashedPassword });
      return UserResponse.base(user);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw HttpException.unavailableEmail();
      }
      throw err;
    }
  };

  update = async (input: UpdateUserInput) => {
    const { currentPassword, password, ...updateData } = input;
    if (!currentPassword) throw HttpException.notFound();

    const storedPassword = await userRepository.findPassword(input.userId);
    if (!storedPassword) throw HttpException.notFound();

    const isPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
    if (!isPasswordValid) throw HttpException.unauthorized(MESSAGE.invalidPassword);

    const hashedPassword = password ? await bcrypt.hash(password, config.app.bcryptSaltRounds) : undefined;

    const user = await userRepository.update({ ...updateData, password: hashedPassword });
    return UserResponse.baseWithImage(user);
  };

  delete = async (input: deleteUser) => {
    return await prisma.$transaction(async (tx) => {
      // 사용자의 모든 디바이스 ID 조회
      const deviceIds = await authRepository.findUserDeviceIds(input.userId, tx);
      // 해당 디바이스들의 모든 RefreshToken 삭제
      await authRepository.deleteRefreshTokensByDeviceIds(deviceIds, DeletedTokenReason.DELETED_USER, tx);
      // 사용자 삭제
      return await userRepository.deleteWithTx(input.userId, tx);
    });
  };

  getLikeStores = async (userId: string) => {
    const result = await userRepository.getLikeStores(userId);
    return UserResponse.getLikeStores(result);
  };
}

export const userService = new UserService();
