import type { IncrementTotalAmountInput, UpdateGrade, UpdateGradeInput } from '../types/metadata.type.js';
import { categoryCache, gradeCache, sizeCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import prisma from '../utils/prisma.js';

const GRADE_CACHE_KEY = 'all';
const CATEGORY_CACHE_KEY_PREFIX = 'name:';
const SIZE_CACHE_KEY_PREFIX = 'id:';

class MetadataRepository {
  gradeList = async () => {
    const cached = gradeCache.get(GRADE_CACHE_KEY);
    if (cached) {
      logger.debug({ target: 'cache', event: 'hit', cache: 'grades' }, '등급 캐시 히트');
      return cached;
    }

    const grades = await prisma.grade.findMany({ orderBy: { minAmount: 'asc' } });
    gradeCache.set(GRADE_CACHE_KEY, grades);
    logger.debug({ target: 'cache', event: 'miss', cache: 'grades' }, '등급 캐시 미스 - DB에서 조회');
    return grades;
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
    const cacheKey = `${CATEGORY_CACHE_KEY_PREFIX}${name}`;
    const cached = categoryCache.get(cacheKey);
    if (cached) {
      logger.debug({ target: 'cache', event: 'hit', cache: 'categories', name }, '카테고리 캐시 히트');
      return cached;
    }

    const category = await prisma.category.findFirst({
      where: { name },
    });

    if (category) {
      categoryCache.set(cacheKey, category);
      logger.debug({ target: 'cache', event: 'miss', cache: 'categories', name }, '카테고리 캐시 미스 - DB에서 조회');
    }
    return category;
  };

  findSizeById = async (id: number) => {
    const cacheKey = `${SIZE_CACHE_KEY_PREFIX}${id}`;
    const cached = sizeCache.get(cacheKey);
    if (cached) {
      logger.debug({ target: 'cache', event: 'hit', cache: 'sizes', id }, '사이즈 캐시 히트');
      return cached;
    }

    const size = await prisma.size.findFirst({
      where: { id },
    });

    if (size) {
      sizeCache.set(cacheKey, size);
      logger.debug({ target: 'cache', event: 'miss', cache: 'sizes', id }, '사이즈 캐시 미스 - DB에서 조회');
    }
    return size;
  };
}

export const metadataRepository = new MetadataRepository();
