import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { s3Service } from '../services/s3.service.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';

interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

class S3Controller {
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, file } = req;

      if (!file) {
        throw HttpException.badRequest('업로드할 파일이 없습니다.');
      }
      if (!user) {
        throw HttpException.unauthorized('인증된 사용자가 아닙니다.');
      }

      const fileInfo = file as MulterS3File;
      const imageData = await s3Service.saveImage(file, fileInfo, user.id);

      logger.info(`[IMAGE_UPLOAD] User(id: ${user.id}) uploaded a file. Key: ${fileInfo.key}, Size: ${file.size}`);

      return res.status(STATUS_CODE.OK).json({
        message: MESSAGE.uploadSuccess,
        data: imageData,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const s3Controller = new S3Controller();
