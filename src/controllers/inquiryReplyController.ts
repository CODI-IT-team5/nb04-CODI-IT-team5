import type { NextFunction, Request, Response } from 'express';

import inquiryReplyService from '../services/inquiryReplyService.js';
import { sendSuccess } from '../utils/response.js';

export class InquiryReplyController {
  // 답변 등록
  async createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inquiryId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const reply = await inquiryReplyService.createReply(inquiryId as string, userId, content as string);

      sendSuccess(res, reply, 201, '답변이 등록되었습니다.');
    } catch (error) {
      next(error);
    }
  }

  // 답변 상세 조회
  async getReplyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { replyId } = req.params;

      const reply = await inquiryReplyService.getReplyById(replyId as string);

      sendSuccess(res, reply);
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

      sendSuccess(res, reply, 200, '답변이 수정되었습니다.');
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

      sendSuccess(res, null, 200, '답변이 삭제되었습니다.');
    } catch (error) {
      next(error);
    }
  }
}

export default new InquiryReplyController();
