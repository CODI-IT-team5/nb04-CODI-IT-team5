import { Router } from 'express';
import inquiryController from '../controllers/inquiryController.js';
import reviewController from '../controllers/reviewController.js';
import { authenticate, requireBuyer } from '../middlewares/auth.js';

const router = Router();

router.post('/:productId/inquiries', authenticate, requireBuyer, inquiryController.createInquiry.bind(inquiryController));

router.get('/:productId/inquiries', inquiryController.getProductInquiries.bind(inquiryController));

router.post('/:productId/reviews', authenticate, requireBuyer, reviewController.createReview.bind(reviewController));

router.get('/:productId/reviews', reviewController.getProductReviews.bind(reviewController));

export default router;
