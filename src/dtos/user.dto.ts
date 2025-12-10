import { UserRole } from '@prisma/client';
import z from 'zod';

import type { UserBase } from '../types/user.type.js';

/**
 * Request 데이터 검증
 */
const passwordDto = z
  .string('비밀번호는 필수이며 문자열이어야 합니다')
  .trim()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .max(100, '비밀번호는 100자를 초과할 수 없습니다');

export const userBaseBody = z.strictObject({
  name: z
    .string('이름은 문자열이야 합니다')
    .trim()
    .min(2, '이름은 두 글자 이상이어야 합니다')
    .max(30, '이름은 30자 이내여야 합니다'),
  type: z.nativeEnum(UserRole),
  email: z
    .string('이메일은 필수이며 문자열이어야 합니다')
    .trim()
    .min(8, '이메일은 8자 이상이어야 합니다')
    .max(64, '이메일은 64자 이하여야 합니다')
    .email('유효한 이메일 형식이 아닙니다'),
  password: passwordDto,
});

export const userDto = {
  register: {
    body: userBaseBody.pick({ name: true, type: true }),
  },
  update: {
    body: userBaseBody
      .pick({ name: true, password: true })
      .partial()
      .extend({
        currentPassword: passwordDto.optional(),
        image: z.url().trim().optional(),
      })
      .refine((data) => !(data.password && !data.currentPassword), {
        message: '비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다',
        path: ['currentPassword'],
      }),
  },
};

/**
 * Response 구조
 * TODO: 이걸 dto 파일에 같이 두는게 맞을지, 따로 만드는게 나을지 고민
 */
export const getByIdResponse = (user: UserBase) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  type: user.type,
  points: user.points,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  grade: {
    name: user.grade.name,
    id: user.grade.id,
    rate: user.grade.rate,
    minAmount: user.grade.minAmount,
  },
  image: user.image,
});
