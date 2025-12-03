import express from 'express';

import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const userRouter = express.Router();

userRouter.get('/me', authMiddleware, userController.getById);
