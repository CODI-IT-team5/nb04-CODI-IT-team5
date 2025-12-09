import type { NextFunction, Request, Response } from 'express';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { HttpException } from '../utils/http-exception.js';

class S3Controller {
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // upload.middleware.ts에서 파일 업로드 후 req.file에 정보가 담김
      if (!req.file) {
        throw HttpException.badRequest('업로드할 파일이 없습니다.');
      }

      // multer-s3가 제공하는 파일 정보
      const fileInfo = req.file as any;
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
