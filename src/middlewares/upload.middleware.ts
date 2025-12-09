import { S3Client } from '@aws-sdk/client-s3';
import type { Request } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config/config.js';
import { HttpException } from '../utils/http-exception.js';
import { MESSAGE, STATUS_CODE } from '../constants/constant.js';

// S3 클라이언트 생성
const s3 = new S3Client({
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
  region: config.aws.region,
});

// YYYYMMDD 형식의 날짜 문자열 생성 함수
const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.aws.bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const date = getFormattedDate();
      const uuid = uuidv4();
      const originalName = file.originalname;
      const ext = path.extname(originalName); // 확장자
      const baseName = path.basename(originalName, ext); // 확장자를 제외한 파일 이름
      cb(null, `uploads/${date}/${uuid}_${baseName}${ext}`);
    },
  }),
  fileFilter: (req: Request, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new HttpException({
        status: STATUS_CODE.BAD_REQUEST,
        message: '이미지 파일만 업로드 가능합니다.'
      }));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});
