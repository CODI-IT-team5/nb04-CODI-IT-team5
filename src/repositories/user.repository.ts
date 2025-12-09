import prisma from '../utils/prisma.js';

class UserRepository {
  getById = async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  };
}

export const userRepository = new UserRepository();
