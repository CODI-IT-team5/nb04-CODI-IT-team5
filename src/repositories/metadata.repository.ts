import type { IncrementTotalAmountInput, UpdateGrade, UpdateGradeInput } from '../types/metadata.type.js';
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

  incrementTotalAmount = async (input: IncrementTotalAmountInput) => {
    return await input.tx.user.update({
      where: { id: input.userId },
      data: {
        totalAmount: { increment: input.deltaAmount },
      },
      include: { grade: true },
    });
  };

  updateGrade = async (input: UpdateGradeInput) => {
    return await input.tx.user.update({
      where: { id: input.userId },
      data: {
        gradeId: input.gradeId,
      },
      include: { grade: true },
    });
  };
  findCategoryByName = async (name: string) => {
    return await prisma.category.findFirst({
      where: { name },
    });
  };

  findSizeById = async (id: number) => {
    return await prisma.size.findFirst({
      where: { id },
    });
  };
}

export const metadataRepository = new MetadataRepository();
