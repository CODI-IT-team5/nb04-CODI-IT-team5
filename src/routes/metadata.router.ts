import express from 'express';

import { metadataController } from '../controllers/metadata.controller.js';

export const metadataRouter = express.Router();

metadataRouter.get('/grade', metadataController.gradeList);
