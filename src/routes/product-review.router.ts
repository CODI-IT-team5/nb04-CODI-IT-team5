import { Router } from 'express';

import reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireBuyer } from '../middlewares/role.middleware.js';

export const productReviewRouter = Router();

// 상품 리뷰 작성/목록 조회
productReviewRouter
  .route('/:productId/reviews')
  .post(authMiddleware, requireBuyer, reviewController.createReview.bind(reviewController))
  .get(reviewController.getProductReviews.bind(reviewController));
