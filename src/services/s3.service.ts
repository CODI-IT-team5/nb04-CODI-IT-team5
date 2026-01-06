import { Prisma } from '@prisma/client';

import { imageRepository } from '../repositories/image.repository.js';
import { S3Response } from '../serializes/s3.serialize.js';
import { HttpException } from '../utils/http-exception.js';

class S3Service {
  saveImage = async (file: Express.Multer.File, fileInfo: { location: string; key: string }, userId: string) => {
    try {
      const { originalname, mimetype, size } = file;
      const { location: url, key } = fileInfo;

      const savedImage = await imageRepository.createImage({
        key,
        url,
        originalName: originalname,
        mimeType: mimetype,
        size,
        userId,
      });

      return S3Response.base(savedImage);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw HttpException.badRequest('유효하지 않은 사용자 ID 입니다.');
      }
      throw err;
    }
  };
}

export const s3Service = new S3Service();
