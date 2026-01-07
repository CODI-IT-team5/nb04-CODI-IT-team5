import { InquiryStatus } from '@prisma/client';
import { z } from 'zod';

export const getMyInquiriesQueryDto = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.nativeEnum(InquiryStatus).optional(),
});

export type GetMyInquiriesQuery = z.infer<typeof getMyInquiriesQueryDto>;
