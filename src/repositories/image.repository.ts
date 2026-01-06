import type { Prisma } from '@prisma/client';

import prisma from '../utils/prisma.js';

class ImageRepository {
  async createImage(data: Prisma.ImageUncheckedCreateInput) {
    return prisma.image.create({ data });
  }
}

export const imageRepository = new ImageRepository();
