import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import inquiryReplyService from '../services/inquiry-reply.service.js';

export class InquiryReplyController {
  // 답변 등록
  async createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const reply = await inquiryReplyService.createReply(inquiryId as string, userId, content as string);

      res.status(STATUS_CODE.CREATED).json(reply);
    } catch (error) {
      next(error);
    }
  }

  // 답변 상세 조회
  async getReplyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { replyId } = req.params;

      const reply = await inquiryReplyService.getReplyById(replyId as string);

      res.status(STATUS_CODE.OK).json(reply);
    } catch (error) {
      next(error);
    }
  }

  // 답변 수정
  async updateReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { replyId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const reply = await inquiryReplyService.updateReply(replyId as string, userId, content as string);

      res.status(STATUS_CODE.OK).json(reply);
    } catch (error) {
      next(error);
    }
  }

  // 답변 삭제
  async deleteReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { replyId } = req.params;
      const userId = req.user!.id;

      await inquiryReplyService.deleteReply(replyId as string, userId);

      res.status(STATUS_CODE.OK).json({ message: '답변이 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new InquiryReplyController();
