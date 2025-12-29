import express from 'express';

import { metadataController } from '../controllers/metadata.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const metadataRouter = express.Router();

metadataRouter.get('/grade', metadataController.gradeList);
metadataRouter.patch('/grade', authMiddleware, metadataController.updateGrade); // 테스트용 임시 라우터
