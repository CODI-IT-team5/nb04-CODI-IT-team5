import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, SEND_BIRD_CODE, STATUS_CODE } from '../constants/constant.js';
import { userService } from '../services/user.service.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

class UserController {
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.debug({
          message: '유저 정보 조회 컨트롤러',
          path: req.originalUrl,
          method: req.method,
          ip: req.ip,
        });
        return next(
          new HttpException({
            status: STATUS_CODE.UNAUTHORIZED,
            message: MESSAGE.userNotFound,
            code: SEND_BIRD_CODE.UserNotFound,
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
