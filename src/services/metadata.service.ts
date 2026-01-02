import { metadataRepository } from '../repositories/metadata.repository.js';
import { MetadataResponse } from '../serializes/metadata.serialize.js';
import type { UpdateGradeServiceInput } from '../types/metadata.type.js';
import { HttpException } from '../utils/http-exception.js';
import prisma from '../utils/prisma.js';

class MetadataService {
  gradeList = async () => {
    const results = await metadataRepository.gradeList();
    return MetadataResponse.getGrade(results);
  };

  updateTotalAmount = async (input: UpdateGradeServiceInput) => {
    return await prisma.$transaction(async (tx) => {
      //TODO: 캐시에서 가져오는 걸로 변경하기
      const grades = await metadataRepository.gradeList();
      if (!grades || grades.length === 0) throw HttpException.notFound();

      const updatedUser = await metadataRepository.incrementTotalAmount({
        userId: input.userId,
        deltaAmount: input.deltaAmount,
        tx,
      });

      const newTotalAmount = updatedUser.totalAmount;
      let newGrade = grades[0];
      for (let i = grades.length - 1; i >= 0; i--) {
        const grade = grades[i];
        if (!grade) continue;

        if (newTotalAmount >= grade.minAmount) {
          newGrade = grade;
          break;
        }
      }

      if (!newGrade) throw HttpException.notFound();

      if (updatedUser.gradeId !== newGrade.id) {
        return await metadataRepository.updateGrade({
          userId: input.userId,
          gradeId: newGrade.id,
          tx,
        });
      }

      return updatedUser;
    });
  };
}

export const metadataService = new MetadataService();
