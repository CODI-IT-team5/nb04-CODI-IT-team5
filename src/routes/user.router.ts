import express from 'express';

import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const userRouter = express.Router();

userRouter.route('/').post(validateMiddleware); // 회원가입

userRouter
  .route('/me')
  .get(authMiddleware, userController.getById) // 내 정보 조회
  .patch(authMiddleware, validateMiddleware); // 내 정보 수정

userRouter.get('/me/likes', authMiddleware); // 관심 스토어 조회
userRouter.delete('/delete', authMiddleware); // 회원 탈퇴
