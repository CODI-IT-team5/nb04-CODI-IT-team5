import { InquiryStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import type { GetMyInquiriesQuery } from '../dtos/inquiry.dto.js';
import { type InquiryDetailWithRelations, InquiryResponse } from '../serializes/inquiry.serialize.js';
import inquiryService from '../services/inquiry.service.js';

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

      res.status(STATUS_CODE.CREATED).json(inquiry);
    } catch (error) {
      next(error);
    }
  }

  // 내 문의 조회
  async getMyInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const userType = req.user!.type;

      const { page, pageSize, status } = req.validated?.query as GetMyInquiriesQuery;

      const { inquiries, totalCount } = await inquiryService.getMyInquiries(userId, userType, {
        page,
        pageSize,
        ...(status ? { status } : {}),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(STATUS_CODE.OK).json(InquiryResponse.list(inquiries as any, totalCount));
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

      res.status(STATUS_CODE.OK).json(InquiryResponse.detail(inquiry as InquiryDetailWithRelations));
    } catch (error) {
      next(error);
    }
  }

  // 상품별 문의 조회
  async getProductInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { page, pageSize, order, status } = req.query;

      const result = await inquiryService.getProductInquiries(
        productId as string,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 10,
        order as 'asc' | 'desc' | undefined,
        status as InquiryStatus | undefined,
      );

      res.json({
        list: result.inquiries,
        totalCount: result.totalCount,
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

      res.status(STATUS_CODE.OK).json(InquiryResponse.detail(inquiry as InquiryDetailWithRelations));
    } catch (error) {
      next(error);
    }
  }

  // 문의 삭제
  async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const userId = req.user!.id;
      const userType = req.user!.type;

      await inquiryService.deleteInquiry(inquiryId as string, userId, userType);

      res.status(STATUS_CODE.OK).json({ message: '문의가 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new InquiryController();
