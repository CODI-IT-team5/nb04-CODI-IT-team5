import prisma from '../utils/prisma.js';

class MetadataRepository {
  list = async () => {
    return await prisma.grade.findMany();
  };
}

export const metadataRepository = new MetadataRepository();
