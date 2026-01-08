import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import { dashboardService } from '../services/dashboard.service.js';

class DashboardController {
  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const dashboard = await dashboardService.getDashboard(userId);
      res.status(STATUS_CODE.OK).json(dashboard);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardController = new DashboardController();
