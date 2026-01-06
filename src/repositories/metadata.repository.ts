import type { UpdateGrade } from '../types/metadata.type.js';
import prisma from '../utils/prisma.js';

class MetadataRepository {
  gradeList = async () => {
    return await prisma.grade.findMany({ orderBy: { minAmount: 'asc' } });
  };

  updateTotalAmountAndGrade = async (input: UpdateGrade) => {
    return await prisma.user.update({
      where: { id: input.userId },
      data: {
        totalAmount: input.newTotalAmount,
        gradeId: input.newGradeId,
      },
    });
  };

  findCategoryByName = async (name: string) => {
    return await prisma.category.findFirst({
      where: { name },
    });
  };

  findSizeById = async (id: string) => {
    return await prisma.size.findFirst({
      where: { id },
    });
  };
}

export const metadataRepository = new MetadataRepository();
