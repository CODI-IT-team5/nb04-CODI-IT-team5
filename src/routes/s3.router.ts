import express from 'express';

import { s3Controller } from '../controllers/s3.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';

export const s3Router = express.Router();

// POST /api/s3/upload
s3Router.post('/upload', authMiddleware, uploadImage, s3Controller.uploadImage);
