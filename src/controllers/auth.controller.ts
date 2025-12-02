import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service.js';

class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputData = {
        email: req.body.email,
        password: req.body.password,
      };
      const result = await authService.login(inputData);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  };
}

export const authController = new AuthController();
