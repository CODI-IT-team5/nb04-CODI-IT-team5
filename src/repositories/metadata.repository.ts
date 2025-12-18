import prisma from '../utils/prisma.js';

class MetadataRepository {
  gradeList = async () => {
    return await prisma.grade.findMany();
  };
}

export const metadataRepository = new MetadataRepository();
