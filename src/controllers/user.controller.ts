import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { userService } from '../services/user.service.js';
import { HttpException } from '../utils/http-exception.js';

class UserController {
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(
          new HttpException({
            status: STATUS_CODE.UNAUTHORIZED,
            message: MESSAGE.unauthorized,
          }),
        );
      }

      const userData = await userService.getById(req.user.id);
      res.status(STATUS_CODE.OK).json(userData);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
