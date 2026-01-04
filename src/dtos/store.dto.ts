import z from 'zod';

const storeBaseBody = z.strictObject({
  name: z
    .string('스토어 이름은 필수이며 문자열이어야 합니다')
    .trim()
    .min(1, '스토어 이름은 최소 1자 이상이어야 합니다')
    .max(50, '스토어 이름은 50자를 초과할 수 없습니다'),
  address: z
    .string('주소는 필수이며 문자열이어야 합니다')
    .trim()
    .min(1, '주소는 필수입니다')
    .max(200, '주소는 200자를 초과할 수 없습니다'),
  detailAddress: z.string().trim().max(100, '상세 주소는 100자를 초과할 수 없습니다').optional(),
  phoneNumber: z
    .string('전화번호는 필수이며 문자열이어야 합니다')
    .regex(/^01[0-9]-\d{3,4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)'),
  content: z
    .string('스토어 소개는 필수이며 문자열이어야 합니다')
    .trim()
    .min(1, '스토어 소개는 필수입니다')
    .max(1000, '스토어 소개는 1000자를 초과할 수 없습니다'),
  image: z.string().url('이미지 URL 형식이 올바르지 않습니다').optional(),
});

const storeUpdateBody = z.strictObject({
  name: z
    .string('스토어 이름은 문자열이어야 합니다')
    .trim()
    .min(1, '스토어 이름은 최소 1자 이상이어야 합니다')
    .max(50, '스토어 이름은 50자를 초과할 수 없습니다')
    .optional(),
  address: z
    .string('주소는 문자열이어야 합니다')
    .trim()
    .min(1, '주소는 필수입니다')
    .max(200, '주소는 200자를 초과할 수 없습니다')
    .optional(),
  detailAddress: z.string().trim().max(100, '상세 주소는 100자를 초과할 수 없습니다').optional(),
  phoneNumber: z
    .string('전화번호는 문자열이어야 합니다')
    .regex(/^01[0-9]-\d{3,4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)')
    .optional(),
  content: z
    .string('스토어 소개는 문자열이어야 합니다')
    .trim()
    .min(1, '스토어 소개는 필수입니다')
    .max(1000, '스토어 소개는 1000자를 초과할 수 없습니다')
    .optional(),
  image: z.string().url('이미지 URL 형식이 올바르지 않습니다').optional(),
});

const storeParams = z.strictObject({
  storeId: z.string('유효하지 않은 스토어 ID 형식입니다'),
});

const myProductsQuery = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: 'page는 1 이상이어야 합니다' }),
  pageSize: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, { message: 'pageSize는 1에서 100 사이여야 합니다' }),
});

export const storeDto = {
  create: {
    body: storeBaseBody,
  },
  update: {
    body: storeUpdateBody,
    params: storeParams,
  },
  getById: {
    params: storeParams,
  },
  toggleFavorite: {
    params: storeParams,
  },
  getMyProducts: {
    query: myProductsQuery,
  },
};

export type CreateStoreDto = z.infer<typeof storeDto.create.body>;
export type UpdateStoreDto = z.infer<typeof storeDto.update.body>;
export type StoreParamsDto = z.infer<typeof storeDto.update.params>;
export type MyProductsQueryDto = z.infer<typeof storeDto.getMyProducts.query>;
