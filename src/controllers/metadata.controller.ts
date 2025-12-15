import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import { metadataService } from '../services/metadata.service.js';

class MeatadataController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await metadataService.list();
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const metadataController = new MeatadataController();
