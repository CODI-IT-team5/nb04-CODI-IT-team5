// src/cart/dtos/cart.dto.ts
import { z } from "zod";

export const patchCartDto = z.object({
  productId: z.string(),
  sizes: z
    .array(
      z.object({
        sizeId: z.string(),          // 스키마에서 Size.id가 String(cuid)니까 string으로
        quantity: z.number().int().min(0), // 0이면 삭제로 처리
      })
    )
    .min(1, "최소 하나 이상의 사이즈가 필요합니다."),
});

export type PatchCartInput = z.infer<typeof patchCartDto>;
