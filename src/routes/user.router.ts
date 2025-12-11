import express from 'express';

import { userController } from '../controllers/user.controller.js';
import { userDto } from '../dtos/user.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const userRouter = express.Router();

userRouter.route('/').post(validateMiddleware(userDto.create), userController.create); // 회원가입

userRouter
  .route('/me')
  .get(authMiddleware, userController.getById) // 내 정보 조회
  .patch(authMiddleware, validateMiddleware(userDto.update), userController.update); // 내 정보 수정

userRouter.get('/me/likes', authMiddleware, userController.getLikeStores); // 관심 스토어 조회
userRouter.delete('/delete', authMiddleware, userController.delete); // 회원 탈퇴
