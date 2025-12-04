import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { config } from '../config/config.js';
import { MESSAGE, SEND_BIRD_CODE, STATUS_CODE } from '../constants/constant.js';
import type { Login } from '../dtos/auth.dto.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { CreateRefreshTokenInput } from '../types/auth.type.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

class AuthService {
  login = async (data: Login) => {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new HttpException({
        status: STATUS_CODE.BAD_REQUEST,
        message: MESSAGE.invalidCredentials,
        code: SEND_BIRD_CODE.ResourceNotFound,
      });
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException({
        status: STATUS_CODE.BAD_REQUEST,
        message: MESSAGE.invalidCredentials,
        code: SEND_BIRD_CODE.ResourceNotFound,
      });
    }

    const accessToken = jwt.sign({ userId: user.id }, config.auth.accessTokenSecretKey, {
      expiresIn: config.auth.accessTokenExpiresIn,
    });
    const refreshToken = jwt.sign({ userId: user.id }, config.auth.refreshTokenSecretKey, {
      expiresIn: config.auth.refreshTokenExpiresIn,
    });

    const decoded = jwt.decode(refreshToken) as { exp: number; iat: number } | null;

    if (!decoded || !decoded.exp) {
      throw new HttpException({
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: MESSAGE.serverError,
        code: SEND_BIRD_CODE.InternalError,
      });
    }

    const refreshTokenExpiresAt = new Date(decoded.exp * 1000);
    const refreshTokenIssuedAt = new Date(decoded.iat * 1000);

    const createRefreshTokenInput: CreateRefreshTokenInput = {
      token: refreshToken,
      userId: user.id,
      issuedAt: refreshTokenIssuedAt,
      expiresAt: refreshTokenExpiresAt,
    };
    try {
      await authRepository.createRefreshToken(createRefreshTokenInput);
    } catch (err) {
      logger.error({ message: '로그인 서비스 에러', error: err, email: data.email });
      throw new HttpException({
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: MESSAGE.serverError,
        code: SEND_BIRD_CODE.InternalError,
      });
    }

    const result = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.points,
        image: user.image,
        grade: {
          id: user.grade.id,
          name: user.grade.name,
          rate: user.grade.rate,
          minAmount: user.grade.minAmount,
        },
      },
      accessToken,
    };

    return result;
  };
}
export const authService = new AuthService();
