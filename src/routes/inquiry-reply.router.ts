import { Router } from 'express';

import inquiryReplyController from '../controllers/inquiry-reply.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSeller } from '../middlewares/role.middleware.js';

const router = Router();

router.post(
  '/:inquiryId/replies',
  authMiddleware,
  requireSeller,
  inquiryReplyController.createReply.bind(inquiryReplyController),
);

router.get('/:replyId/replies', authMiddleware, inquiryReplyController.getReplyById.bind(inquiryReplyController));

router.patch(
  '/:replyId/replies',
  authMiddleware,
  requireSeller,
  inquiryReplyController.updateReply.bind(inquiryReplyController),
);

router.delete(
  '/:replyId/replies',
  authMiddleware,
  requireSeller,
  inquiryReplyController.deleteReply.bind(inquiryReplyController),
);

export default router;
