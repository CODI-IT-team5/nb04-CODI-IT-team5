import { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { HttpException } from '../utils/http-exception.js';

export const requireBuyer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.type !== UserRole.BUYER) {
    return next(
      new HttpException({
        status: 403,
        message: '구매자만 접근할 수 있습니다.',
      }),
    );
  }

  next();
};

export const requireSeller = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.type !== UserRole.SELLER) {
    return next(
      new HttpException({
        status: 403,
        message: '판매자만 접근할 수 있습니다.',
      }),
    );
  }

  next();
};
