import { z } from 'zod';

export const authDto = {
  login: {
    body: z.strictObject({
      email: z
        .string('이메일은 필수이며 문자열이어야 합니다')
        .trim()
        .min(8, '이메일은 8자 이상이어야 합니다')
        .max(64, '이메일은 64자 이하여야 합니다')
        .email('유효한 이메일 형식이 아닙니다'),
      password: z
        .string('비밀번호는 필수이며 문자열이어야 합니다')
        .trim()
        .min(8, '비밀번호는 8자 이상이어야 합니다')
        .max(100, '비밀번호는 100자를 초과할 수 없습니다'),
    }),
  },
  refreshToken: {
    body: z.object({
      refreshToken: z.string().jwt(),
    }),
  },
};

export type Login = z.infer<typeof authDto.login.body>;
