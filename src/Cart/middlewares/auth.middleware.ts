// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-secret';

// JWT 안에 넣을 payload 타입 (로그인 시 이 형식으로 발급한다고 가정)
export interface TokenPayload {
  userId: string;
  email?: string;
  type?: 'BUYER' | 'SELLER';
  // 필요하면 여기 더 추가 (예: nickname, grade 등)
}

// Express Request 확장: req.user 로 접근하기 위함
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      type?: 'BUYER' | 'SELLER';
    };
  }
}

/**
 * 인증 미들웨어
 * - Authorization: Bearer <token> 형식의 액세스 토큰을 검증
 * - 성공 시 req.user에 { id, email, type } 주입
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        statusCode: 401,
        message: '인증이 필요합니다.',
        error: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      console.error('[authMiddleware] jwt.verify error:', error);
      return res.status(401).json({
        statusCode: 401,
        message: '유효하지 않은 토큰이거나 만료된 토큰입니다.',
        error: 'Unauthorized',
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        statusCode: 401,
        message: '유효하지 않은 토큰입니다.',
        error: 'Unauthorized',
      });
    }

    // 컨트롤러/서비스에서 req.user로 접근할 수 있도록 바인딩
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };

    next();
  } catch (error) {
    console.error('[authMiddleware] unexpected error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: '인증 처리 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 판매자(Seller) 전용 라우트 보호 미들웨어
 * - authMiddleware 이후에 사용해야 함
 */
export function requireSeller(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      statusCode: 401,
      message: '인증이 필요합니다.',
      error: 'Unauthorized',
    });
  }

  if (req.user.type !== 'SELLER') {
    return res.status(403).json({
      statusCode: 403,
      message: '판매자만 접근 가능한 기능입니다.',
      error: 'Forbidden',
    });
  }

  next();
}

/**
 * 구매자(Buyer) 전용 라우트 보호 미들웨어
 * - authMiddleware 이후에 사용해야 함
 */
export function requireBuyer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      statusCode: 401,
      message: '인증이 필요합니다.',
      error: 'Unauthorized',
    });
  }

  if (req.user.type !== 'BUYER') {
    return res.status(403).json({
      statusCode: 403,
      message: '구매자만 접근 가능한 기능입니다.',
      error: 'Forbidden',
    });
  }

  next();
}
