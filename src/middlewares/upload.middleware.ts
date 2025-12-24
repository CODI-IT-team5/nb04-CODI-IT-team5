import { S3Client } from '@aws-sdk/client-s3';
import type { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config/config.js';
import { HttpException } from '../utils/http-exception.js';

// 허용할 파일 확장자 및 MIME 타입 정의
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MIME_TYPE_MAP: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

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

// Multer 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.aws.bucketName!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const date = getFormattedDate();
      const uuid = uuidv4();
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      cb(null, `uploads/${date}/${uuid}_${baseName}${ext}`);
    },
  }),
  fileFilter: (req: Request, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);

    // 1. 허용된 확장자인지 검증
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(HttpException.badRequest(`허용되지 않는 확장자입니다: ${ext}`));
    }

    // 2. 허용된 MIME 타입인지 검증
    const allowedMimeTypes = Object.keys(MIME_TYPE_MAP);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(HttpException.badRequest('허용되지 않는 파일 유형입니다.'));
    }

    // 3. 확장자와 MIME 타입이 일치하는지 검증
    if (!MIME_TYPE_MAP[file.mimetype]?.includes(ext)) {
      return cb(HttpException.badRequest('파일 확장자와 실제 파일 유형이 일치하지 않습니다.'));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

 // Multer 에러를 핸들링하는 커스텀 미들웨어
export const uploadImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return next(HttpException.badRequest('파일 크기는 5MB를 초과할 수 없습니다.'));
        case 'LIMIT_UNEXPECTED_FILE':
          return next(HttpException.badRequest('하나의 파일만 업로드할 수 있습니다.'));
        default:
          // 기타 Multer 에러
          return next(HttpException.badRequest(`파일 업로드 중 오류가 발생했습니다: ${err.message}`));
      }
    } else if (err) {
      // fileFilter에서 발생한 HttpException 또는 기타 에러
      return next(err);
    }

    // 에러가 없으면 다음 미들웨어로 진행
    next();
  });
};