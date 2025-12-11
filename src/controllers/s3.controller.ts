import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { HttpException } from '../utils/http-exception.js';

interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

class S3Controller {
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw HttpException.badRequest('업로드할 파일이 없습니다.');
      }

      const fileInfo = req.file as MulterS3File;

      const fileUrl = fileInfo.location;
      const fileKey = fileInfo.key;

      return res.status(STATUS_CODE.OK).json({
        message: MESSAGE.uploadSuccess,
        url: fileUrl,
        key: fileKey,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const s3Controller = new S3Controller();
