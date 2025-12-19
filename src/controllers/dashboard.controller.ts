import type { Request, Response, NextFunction } from 'express';

import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          statusCode: 401,
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
        });
      }

      const dashboard = await dashboardService.getDashboard(userId);
      return res.status(200).json(dashboard);
    } catch (err) {
      return next(err);
    }
  },
};
