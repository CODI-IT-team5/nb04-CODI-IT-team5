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
}

export const metadataRepository = new MetadataRepository();
