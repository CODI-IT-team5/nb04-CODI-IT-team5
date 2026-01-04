import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import { storeService } from '../services/store.service.js';
import { HttpException } from '../utils/http-exception.js';

class StoreController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await storeService.create({ ...req.body, userId: req.user.id });
      res.status(STATUS_CODE.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const { storeId } = req.params;
      const result = await storeService.update({ ...req.body, storeId, userId: req.user.id });
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.params;
      if (!storeId) throw HttpException.badRequest('storeId가 필요합니다');
      const result = await storeService.getById({ storeId });
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await storeService.getMyStore(req.user.id);
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const { page, pageSize } = req.validated?.query || {};
      const result = await storeService.getMyProducts({
        page: page as number,
        pageSize: pageSize as number,
        userId: req.user.id,
      });
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const { storeId } = req.params;
      if (!storeId) throw HttpException.badRequest('storeId가 필요합니다');
      const result = await storeService.toggleFavorite({ storeId, userId: req.user.id });
      res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const storeController = new StoreController();
