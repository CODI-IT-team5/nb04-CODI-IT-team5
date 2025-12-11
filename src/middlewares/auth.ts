import { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/config.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import prisma from '../utils/prisma.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);

    // JWT 검증
    const decoded = jwt.verify(token, config.auth.accessTokenSecretKey) as { userId: string };

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, type: true },
    });

    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }

    // req.user에 사용자 정보 설정
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
    } else {
      next(error);
    }
  }
};

export const requireBuyer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('인증이 필요합니다.');
  }

  if (req.user.type !== UserRole.BUYER) {
    throw new ForbiddenError('구매자만 접근할 수 있습니다.');
  }

  next();
};

export const requireSeller = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('인증이 필요합니다.');
  }

  if (req.user.type !== UserRole.SELLER) {
    throw new ForbiddenError('판매자만 접근할 수 있습니다.');
  }

  next();
};
