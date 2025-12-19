import { metadataRepository } from '../repositories/metadata.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { MetadataResponse } from '../serializes/metadata.serialize.js';
import type { UpdateGradeServiceInput } from '../types/metadata.type.js';
import { HttpException } from '../utils/http-exception.js';

class MetadataService {
  gradeList = async () => {
    const results = await metadataRepository.gradeList();
    return MetadataResponse.getGrade(results);
  };

  updateTotalAmount = async (input: UpdateGradeServiceInput) => {
    const user = await userRepository.getById(input.userId);
    if (!user) throw HttpException.userNotFound();

    const newTotalAmount = user.totalAmount + input.deltaAmount;

    //TODO: 캐시에서 가져오는 걸로 변경하기
    const grades = await metadataRepository.gradeList();
    if (!grades || grades.length === 0) throw HttpException.notFound();

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
    const result = await metadataRepository.updateTotalAmountAndGrade({
      userId: input.userId,
      newTotalAmount,
      newGradeId: newGrade.id,
    });
    return result;
  };
}

export const metadataService = new MetadataService();
