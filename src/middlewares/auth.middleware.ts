import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/config.js';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import type { AccessTokenPayload } from '../types/auth.type.js';
import { HttpException } from '../utils/http-exception.js';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const accessToken = authHeader && authHeader.split(' ')[1];

  if (!accessToken) {
    return next(tokenError());
  }

  try {
    const decoded = jwt.verify(accessToken, config.auth.accessTokenSecretKey);

    if (!isTokenPayload(decoded)) {
      return next(tokenError());
    }

    req.user = { id: decoded.userId };

    next();
  } catch {
    return next(tokenError());
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

const tokenError = () => {
  throw new HttpException({
    status: STATUS_CODE.UNAUTHORIZED,
    message: MESSAGE.unauthorized,
  });
};
