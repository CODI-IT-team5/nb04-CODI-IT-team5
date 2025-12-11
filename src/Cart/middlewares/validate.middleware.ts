// src/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * 기본: body 검사용
 * 필요하면 validate(schema, "query") 이런 식으로도 사용 가능
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = part === 'body' ? req.body : part === 'query' ? req.query : req.params;

      const parsed = schema.parse(data);

      // 파싱 결과를 다시 덮어써서 타입 맞도록
      if (part === 'body') req.body = parsed;
      if (part === 'query') req.query = parsed as any;
      if (part === 'params') req.params = parsed as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issues) => ({
          path: issues.path.join('.'),
          message: issues.message,
        }));

        return res.status(400).json({
          statusCode: 400,
          message: '요청 값이 올바르지 않습니다.',
          errors: messages,
        });
      }

      console.error('[validate] error:', error);
      return res.status(500).json({
        statusCode: 500,
        message: '요청 검증 중 서버 오류가 발생했습니다.',
      });
    }
  };
}
