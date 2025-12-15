import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/config.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { AccessTokenPayload } from '../types/auth.type.js';
import { HttpException } from '../utils/http-exception.js';
import logger, { getLogMeta } from '../utils/logger.js';

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const accessToken = authHeader && authHeader.split(' ')[1];

  if (!accessToken) {
    logger.warn(
      {
        event: 'auth_fail',
        ...getLogMeta(req),
      },
      '인증 실패: no token',
    );

    return next(HttpException.tokenError());
  }

  try {
    const decoded = jwt.verify(accessToken, config.auth.accessTokenSecretKey);

    if (!isTokenPayload(decoded)) {
      logger.warn(
        {
          event: 'auth_fail',
          ...getLogMeta(req),
        },
        '인증 실패: invalid payload',
      );
      return next(HttpException.tokenError());
    }

const user = await authRepository.findUserById(decoded.userId);

      if (!user) {
        logger.warn(
          {
            event: 'auth_fail',
            userId: decoded.userId,
            ...getLogMeta(req),
          },
          '인증 실패: user not found',
        );
        return next(HttpException.userNotFound());
      }

      req.user = user;
    
    logger.info(
      {
        event: 'auth_success',
        userId: decoded.userId,
        ...getLogMeta(req),
      },
      '인증 성공',
    );
    next();
  } catch (err) {
    logger.warn(
      {
        event: 'auth_fail',
        ...getLogMeta(req),
        error: err instanceof Error ? err.message : String(err),
      },
      '인증 실패: token verify error',
    );

    return next(HttpException.tokenError());
  }
};

const isTokenPayload = (decoded: unknown): decoded is AccessTokenPayload => {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'userId' in decoded &&
    typeof (decoded as AccessTokenPayload).userId === 'string'
  );
};
