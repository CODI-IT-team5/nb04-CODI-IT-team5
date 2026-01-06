import { UserRole } from '@prisma/client';
import z from 'zod';

/**
 * Request 데이터 검증
 */
const passwordDto = z
  .string()
  .transform((value) => value.replace(/\s+/g, '')) // 공백 제거
  .pipe(
    z
      .string('비밀번호는 필수이며 문자열이어야 합니다')
      .trim()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .max(100, '비밀번호는 100자를 초과할 수 없습니다'),
  );

export const userBaseBody = z.strictObject({
  name: z
    .string()
    .transform((value) => value.replace(/\s+/g, '')) // 공백 제거
    .pipe(
      z
        .string('이름은 문자열이야 합니다')
        .trim()
        .min(2, '이름은 두 글자 이상이어야 합니다')
        .max(30, '이름은 30자 이내여야 합니다'),
    ),
  type: z.nativeEnum(UserRole),
  email: z
    .string()
    .transform((value) => value.replace(/\s+/g, '')) // 공백 제거
    .pipe(
      z
        .string('이메일은 필수이며 문자열이어야 합니다')
        .trim()
        .min(8, '이메일은 8자 이상이어야 합니다')
        .max(64, '이메일은 64자 이하여야 합니다')
        .email('유효한 이메일 형식이 아닙니다'),
    ),
  password: passwordDto,
});

export const userDto = {
  create: {
    body: userBaseBody,
  },
  update: {
    body: userBaseBody
      .pick({
        name: true,
        password: true,
      })
      .partial()
      .extend({
        currentPassword: passwordDto,
        imageId: z.string('이미지 id는 문자열이어야 합니다').optional(),
      }),
  },
};

export type createUser = z.infer<typeof userDto.create.body>;
