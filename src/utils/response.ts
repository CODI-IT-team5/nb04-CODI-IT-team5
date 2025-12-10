import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200, message?: string): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, statusCode: number, message: string): Response => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  return res.status(statusCode).json(response);
};
