import { NotificationType } from '@prisma/client';

import { metadataRepository } from '../repositories/metadata.repository.js';
import { MetadataResponse } from '../serializes/metadata.serialize.js';
import type { UpdateGradeServiceInput } from '../types/metadata.type.js';
import { HttpException } from '../utils/http-exception.js';
import { logger } from '../utils/logger.js';
import prisma from '../utils/prisma.js';
import { notificationService } from './notification.service.js';

class MetadataService {
  gradeList = async () => {
    const results = await metadataRepository.gradeList();
    return MetadataResponse.getGrade(results);
  };

  updateTotalAmount = async (input: UpdateGradeServiceInput) => {
    const result = await prisma.$transaction(async (tx) => {
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

      const oldGrade = updatedUser.grade;
      const isGradeUpgrade = oldGrade.minAmount < newGrade.minAmount;

      if (updatedUser.gradeId !== newGrade.id) {
        const updatedUserWithNewGrade = await metadataRepository.updateGrade({
          userId: input.userId,
          gradeId: newGrade.id,
          tx,
        });

        return {
          user: updatedUserWithNewGrade,
          isGradeUpgrade,
          oldGrade,
          newGrade,
        };
      }

      return {
        user: updatedUser,
        isGradeUpgrade: false,
        oldGrade,
        newGrade,
      };
    });

    if (result.isGradeUpgrade) {
      try {
        await notificationService.createNotification({
          userId: input.userId,
          type: NotificationType.GRADE_UPGRADE,
          content: `축하드립니다. ${result.newGrade.name} 등급으로 승급되었습니다!`,
          url: '/buyer/mypage',
        });
      } catch (err) {
        logger.error(err as Error, '등급 상승 알림 전송 실패:');
      }
    }

    return result.user;
  };
}

export const metadataService = new MetadataService();
