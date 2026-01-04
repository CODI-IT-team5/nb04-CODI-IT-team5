import { z } from 'zod';

// 재고 아이템 스키마 (상품 생성/수정용)
export const stockItemSchema = z.object({
  sizeId: z.string().min(1, '사이즈 ID는 필수입니다'),
  quantity: z.number().int().min(0, '수량은 0 이상이어야 합니다'),
});

// 공통 상품 ID 파라미터 스키마
const productIdParamsSchema = z.object({
  productId: z.string().min(1, '상품 ID는 필수입니다'),
});

// 기본 상품 스키마 (생성용)
const baseProductSchema = z.object({
  name: z.string().min(1, '상품명은 필수입니다').max(100, '상품명은 100자 이하여야 합니다'),
  price: z.number().int().min(0, '가격은 0 이상이어야 합니다'),
  content: z.string().optional(),
  image: z.string().url('올바른 URL 형식이 아닙니다').optional(),
  categoryName: z.string().min(1, '카테고리명은 필수입니다'),
  stocks: z.array(stockItemSchema).min(1, '최소 하나 이상의 재고 정보가 필요합니다'),
  discountRate: z.number().int().min(0).max(100, '할인율은 0-100 사이여야 합니다').optional(),
  discountStartTime: z.string().datetime('올바른 날짜 형식이 아닙니다').optional(),
  discountEndTime: z.string().datetime('올바른 날짜 형식이 아닙니다').optional(),
});

// 상품 생성 DTO
export const createProductDto = {
  body: baseProductSchema,
};

// 상품 수정 DTO - 기본 스키마를 partial로 만들고 isSoldOut 추가
export const updateProductDto = {
  params: productIdParamsSchema,
  body: baseProductSchema.partial().extend({
    isSoldOut: z.boolean().optional(),
  }),
};

// 상품 목록 조회 DTO
export const getProductListDto = {
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    search: z.string().optional(),
    sort: z.enum(['mostReviewed', 'recent', 'lowPrice', 'highPrice', 'highRating', 'salesRanking']).optional(),
    priceMin: z.string().regex(/^\d+$/).transform(Number).optional(),
    priceMax: z.string().regex(/^\d+$/).transform(Number).optional(),
    size: z.string().optional(),
    favoriteStore: z.string().optional(),
    categoryName: z.string().optional(),
  }),
};

// 상품 상세 조회 DTO
export const getProductByIdDto = {
  params: productIdParamsSchema,
};

// 상품 삭제 DTO
export const deleteProductDto = {
  params: productIdParamsSchema,
};

// 타입 내보내기
export type CreateProductInput = z.infer<typeof createProductDto.body>;
export type UpdateProductInput = z.infer<typeof updateProductDto.body>;
export type GetProductListQuery = z.infer<typeof getProductListDto.query>;
export type StockItem = z.infer<typeof stockItemSchema>;
