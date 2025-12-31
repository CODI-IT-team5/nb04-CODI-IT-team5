import type { createUser } from '../dtos/user.dto.js';
import type { UpdateUser } from '../types/user.type.js';
import prisma, { type ExtendedTransactionClient } from '../utils/prisma.js';

class UserRepository {
  getById = async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  };

  create = async (inputData: createUser) => {
    return await prisma.user.create({
      data: {
        name: inputData.name,
        email: inputData.email,
        password: inputData.password,
        type: inputData.type,
        grade: { connect: { id: 'grade_green' } },
      },
      include: { grade: true },
    });
  };

  findPassword = async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });
    return user?.password;
  };

  update = async (inputData: UpdateUser) => {
    return await prisma.user.update({
      where: { id: inputData.userId },
      data: {
        ...(inputData.name !== undefined && { name: inputData.name }),
        ...(inputData.password !== undefined && { password: inputData.password }),
        ...(inputData.image !== undefined && { image: inputData.image }),
      },
      include: { grade: true },
    });
  };

  delete = async (id: string) => {
    return await prisma.user.delete({
      where: { id },
    });
  };

  deleteWithTx = async (id: string, tx: ExtendedTransactionClient) => {
    return await tx.user.delete({
      where: { id },
    });
  };

  getLikeStores = async (userId: string) => {
    return await prisma.favoriteStore.findMany({
      where: { userId },
      include: { store: true },
    });
  };
}

export const userRepository = new UserRepository();
