import { Router } from 'express';

import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSeller } from '../middlewares/role.middleware.js';
import { dashboardController } from '../controllers/dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', authMiddleware, requireSeller, dashboardController.getDashboard);
