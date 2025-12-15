import prisma from '../utils/prisma.js';

export class StoreRepository {
  async findByUserId(userId: string) {
    return prisma.store.findUnique({
      where: { userId },
    });
  }
}

export default new StoreRepository();
