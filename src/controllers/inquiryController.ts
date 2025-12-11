import type { NextFunction, Request, Response } from 'express';

import inquiryService from '../services/inquiryService.js';
import { sendSuccess } from '../utils/response.js';

export class InquiryController {
  // 문의 등록
  async createInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { title, content, isSecret } = req.body;
      const userId = req.user!.id;

      const inquiry = await inquiryService.createInquiry({
        title: title as string,
        content: content as string,
        isSecret: isSecret || false,
        userId,
        productId: productId as string,
      });

      sendSuccess(res, inquiry, 201, '문의가 등록되었습니다.');
    } catch (error) {
      next(error);
    }
  }

  // 내 문의 조회
  async getMyInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const userType = req.user!.type;

      const inquiries = await inquiryService.getMyInquiries(userId, userType);

      sendSuccess(res, inquiries);
    } catch (error) {
      next(error);
    }
  }

  // 문의 상세 조회
  async getInquiryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const userId = req.user!.id;
      const userType = req.user!.type;

      const inquiry = await inquiryService.getInquiryById(inquiryId as string, userId, userType);

      sendSuccess(res, inquiry);
    } catch (error) {
      next(error);
    }
  }

  // 상품별 문의 조회
  async getProductInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;

      const inquiries = await inquiryService.getProductInquiries(productId as string);

      res.json({
        list: inquiries,
        totalCount: inquiries.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // 문의 수정
  async updateInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const { title, content, isSecret } = req.body;
      const userId = req.user!.id;

      const inquiry = await inquiryService.updateInquiry(inquiryId as string, userId, {
        title,
        content,
        isSecret,
      });

      sendSuccess(res, inquiry, 200, '문의가 수정되었습니다.');
    } catch (error) {
      next(error);
    }
  }

  // 문의 삭제
  async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const userId = req.user!.id;

      await inquiryService.deleteInquiry(inquiryId as string, userId);

      sendSuccess(res, null, 200, '문의가 삭제되었습니다.');
    } catch (error) {
      next(error);
    }
  }
}

export default new InquiryController();
