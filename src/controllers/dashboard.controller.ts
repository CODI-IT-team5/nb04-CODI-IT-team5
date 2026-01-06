import type { NextFunction, Request, Response } from 'express';

import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { dashboardService } from '../services/dashboard.service.js';
import { HttpException } from '../utils/http-exception.js';

class DashboardController {
  private getUserIdOr401(req: Request): string {
    const userId = req.user?.id;
    if (!userId) {
      throw HttpException.unauthorized(MESSAGE.unauthorized);
    }
    return userId;
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdOr401(req);
      const dashboard = await dashboardService.getDashboard(userId);
      return res.status(STATUS_CODE.OK).json(dashboard);
    } catch (err) {
      return next(err);
    }
  };
}

export const dashboardController = new DashboardController();
