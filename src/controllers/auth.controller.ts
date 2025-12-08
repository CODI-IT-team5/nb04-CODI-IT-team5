import type { NextFunction, Request, Response } from 'express';

import { config } from '../config/config.js';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { authService } from '../services/auth.service.js';

class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginInputData = {
        email: req.body.email,
        password: req.body.password,
        userAgent: req.header('User-Agent') ?? null,
        ip: req.ip ?? null,
      };
      const { user, accessToken, refreshToken } = await authService.login(loginInputData);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.app.node_env === 'production',
        sameSite: 'strict',
        maxAge: config.app.cookieMaxAge,
      });
      return res.status(STATUS_CODE.CREATED).json({ user, accessToken });
    } catch (err) {
      return next(err);
    }
  };
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['refreshToken'];
      const result = await authService.refresh(refreshToken);
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      return next(err);
    }
  };
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['refreshToken'];
      await authService.logout(refreshToken);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.app.node_env === 'production',
        sameSite: 'strict',
      });
      return res.status(STATUS_CODE.OK).json({ message: MESSAGE.logoutSuccess });
    } catch (err) {
      return next(err);
    }
  };
}

export const authController = new AuthController();
