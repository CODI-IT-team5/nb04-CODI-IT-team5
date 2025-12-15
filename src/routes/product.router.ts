import { Router } from 'express';

import inquiryController from '../controllers/inquiry.controller.js';
import reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireBuyer } from '../middlewares/role.middleware.js';

const router = Router();

router.post(
  '/:productId/inquiries',
  authMiddleware,
  requireBuyer,
  inquiryController.createInquiry.bind(inquiryController),
);

router.get('/:productId/inquiries', inquiryController.getProductInquiries.bind(inquiryController));

router.post('/:productId/reviews', authMiddleware, requireBuyer, reviewController.createReview.bind(reviewController));

router.get('/:productId/reviews', reviewController.getProductReviews.bind(reviewController));

export default router;
