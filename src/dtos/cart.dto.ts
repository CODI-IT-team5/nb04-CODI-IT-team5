import { z } from 'zod';

export const patchCartDto = z.object({
  productId: z.string().min(1, '상품 ID가 필요합니다.'),
  sizes: z
    .array(
      z.object({
        sizeId: z.string().min(1, '사이즈 ID가 필요합니다.'),
        quantity: z.number().int('수량은 정수여야 합니다.'),
      }),
    )
    .min(1, '최소 1개의 사이즈가 필요합니다.'),
});

export type PatchCartInput = z.infer<typeof patchCartDto>;
