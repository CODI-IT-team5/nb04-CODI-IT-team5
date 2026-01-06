import { Router } from 'express';

import inquiryController from '../controllers/inquiry.controller.js';
import inquiryReplyController from '../controllers/inquiry-reply.controller.js';
import { getMyInquiriesQueryDto } from '../dtos/inquiry.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSeller } from '../middlewares/role.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const inquiryRouter = Router();

// 내 문의 조회
inquiryRouter.get(
  '/',
  authMiddleware,
  validateMiddleware({ query: getMyInquiriesQueryDto }),
  inquiryController.getMyInquiries.bind(inquiryController),
);

// 문의 상세 조회/수정/삭제
inquiryRouter
  .route('/:inquiryId')
  .get(authMiddleware, inquiryController.getInquiryById.bind(inquiryController))
  .patch(authMiddleware, inquiryController.updateInquiry.bind(inquiryController))
  .delete(authMiddleware, inquiryController.deleteInquiry.bind(inquiryController));

// 문의 답변 등록/조회/삭제
inquiryRouter
  .route('/:inquiryId/replies')
  .post(authMiddleware, requireSeller, inquiryReplyController.createReply.bind(inquiryReplyController))
  .get(authMiddleware, inquiryReplyController.getReplyById.bind(inquiryReplyController))
  .delete(authMiddleware, requireSeller, inquiryReplyController.deleteReply.bind(inquiryReplyController));

// 문의 답변 수정
inquiryRouter
  .route('/:replyId/replies')
  .patch(authMiddleware, requireSeller, inquiryReplyController.updateReply.bind(inquiryReplyController));
