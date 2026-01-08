import type { NextFunction, Request, Response } from 'express';

import { config } from '../config/config.js';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { userService } from '../services/user.service.js';
import { HttpException } from '../utils/http-exception.js';

class UserController {
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await userService.getById(req.user.id);
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.create({ ...req.body });
      res.status(STATUS_CODE.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await userService.update({ ...req.body, userId: req.user.id });
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      await userService.delete({ userId: req.user.id, refreshToken: req.cookies['refreshToken'] });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.app.node_env === 'production',
        sameSite: 'strict',
      });
      res.status(STATUS_CODE.OK).json({ message: MESSAGE.userDeleted });
    } catch (err) {
      next(err);
    }
  };

  getLikeStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await userService.getLikeStores(req.user.id);
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
