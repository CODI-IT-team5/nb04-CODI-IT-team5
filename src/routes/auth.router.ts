import express from 'express';

import { authController } from '../controllers/auth.controller.js';
import { authDto } from '../dtos/auth.dto.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const authRouter = express.Router();

authRouter.post('/login', validateMiddleware(authDto.login), authController.login);
