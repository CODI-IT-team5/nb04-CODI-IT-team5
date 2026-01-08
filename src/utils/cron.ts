import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

import { config } from '../config/config.js';
import { logger } from './logger.js';

const hardDeletePrisma = new PrismaClient();

// 데이터 보관 정책 정의
const RETENTION_POLICIES = {
  // 주문 및 결제 관한 기록 - 5년 (전자상거래법)
  TAX_DATA: {
    days: config.cron.retentionDays.taxData,
    models: ['Payment', 'OrderItem', 'Order'],
  },
  // 일반 사용자 데이터 - 30일 (30일 이내에 복구 기능 추후 구현 가능)
  USER_DATA: {
    days: config.cron.retentionDays.userData,
    models: ['Product', 'Store', 'User'],
  },
  // 접속 및 인증 관련 데이터 - 3개월 (통신비밀보호법)
  AUTH_DATA: {
    days: config.cron.retentionDays.authData,
    models: ['RefreshToken', 'Device'],
  },
} as const;

async function deleteBatch(
  model: {
    findMany: (args: {
      where: { deletedAt: { lt: Date } };
      take: number;
      select: { id: true };
    }) => Promise<{ id: string }[]>;
    deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<{ count: number }>;
  },
  threshold: Date,
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    // 배치 크기만큼 id 조회
    const records = await model.findMany({
      where: { deletedAt: { lt: threshold } },
      take: config.cron.batchSize,
      select: { id: true },
    });

    if (records.length === 0) {
      break;
    }

    // id 목록으로 삭제
    const ids = records.map((record) => record.id);
    const result = await model.deleteMany({
      where: { id: { in: ids } },
    });

    totalDeleted += result.count;

    // 배치 간 대기 (DB 부하 분산)
    if (records.length === config.cron.batchSize) {
      await new Promise((resolve) => setTimeout(resolve, config.cron.batchDelay));
    } else {
      // 마지막 배치면 종료
      break;
    }
  }

  return totalDeleted;
}

// Cron 스케줄
cron.schedule(config.cron.schedule, async () => {
  logger.info(
    {
      target: 'cron',
      event: 'hard-delete-scheduled',
      schedule: config.cron.schedule,
    },
    `Hard delete cron job 시작 (스케줄: ${config.cron.schedule})`,
  );
  try {
    let totalDeleted = 0;

    for (const [policyName, policy] of Object.entries(RETENTION_POLICIES)) {
      const threshold = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      logger.info(
        {
          target: 'cron',
          event: 'hard-delete-start',
          policy: policyName,
          retentionDays: policy.days,
          threshold,
        },
        `${policyName} 정책 적용 (보관기간: ${policy.days}일)`,
      );

      for (const modelName of policy.models) {
        try {
          const modelKey = modelName;
          const model = hardDeletePrisma[modelKey];

          const count = await deleteBatch(
            model as unknown as {
              findMany: (args: {
                where: { deletedAt: { lt: Date } };
                take: number;
                select: { id: true };
              }) => Promise<{ id: string }[]>;
              deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<{ count: number }>;
            },
            threshold,
          );

          if (count > 0) {
            totalDeleted += count;
            logger.info(
              {
                target: 'cron',
                event: 'hard-delete',
                policy: policyName,
                model: modelName,
                count,
                retentionDays: policy.days,
                batchSize: config.cron.batchSize,
              },
              `${modelName}에서 ${count}개 hard delete 완료`,
            );
          }
        } catch (err) {
          logger.error(
            {
              target: 'cron',
              event: 'hard-delete-error',
              policy: policyName,
              model: modelName,
              err,
            },
            `${modelName} hard delete 실패`,
          );
        }
      }
    }

    logger.info(
      {
        target: 'cron',
        event: 'hard-delete-complete',
        totalDeleted,
        policies: Object.keys(RETENTION_POLICIES),
      },
      `총 ${totalDeleted}개 레코드 hard delete 완료`,
    );
  } catch (err) {
    logger.error(
      {
        target: 'cron',
        event: 'hard-delete-fatal-error',
        err,
      },
      'Hard delete cron job 문제 발생',
    );
  }
});
