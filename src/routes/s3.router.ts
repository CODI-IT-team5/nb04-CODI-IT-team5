import express from 'express';

import { s3Controller } from '../controllers/s3.controller.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';

export const s3Router = express.Router();

// POST /api/s3/upload
s3Router.post('/upload', uploadMiddleware.single('image'), s3Controller.uploadImage);
