import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import { metadataService } from '../services/metadata.service.js';
import { HttpException } from '../utils/http-exception.js';

class MetadataController {
  gradeList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await metadataService.gradeList();
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };

  // TODO: 테스트용 컨트롤러, 테스트 코드 작성 후에 지우기
  updateGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw HttpException.userNotFound();
      const result = await metadataService.updateTotalAmount({
        userId: req.user.id,
        deltaAmount: req.body.deltaAmount,
      });
      return res.status(STATUS_CODE.OK).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const metadataController = new MetadataController();
