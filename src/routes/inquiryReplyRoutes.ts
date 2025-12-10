import { Router } from 'express';

import inquiryReplyController from '../controllers/inquiryReplyController.js';
import { authenticate, requireSeller } from '../middlewares/auth.js';

const router = Router();

router.post(
  '/:inquiryId/replies',
  authenticate,
  requireSeller,
  inquiryReplyController.createReply.bind(inquiryReplyController),
);

router.get('/:replyId/replies', authenticate, inquiryReplyController.getReplyById.bind(inquiryReplyController));

router.patch(
  '/:replyId/replies',
  authenticate,
  requireSeller,
  inquiryReplyController.updateReply.bind(inquiryReplyController),
);

router.delete(
  '/:replyId/replies',
  authenticate,
  requireSeller,
  inquiryReplyController.deleteReply.bind(inquiryReplyController),
);

export default router;
