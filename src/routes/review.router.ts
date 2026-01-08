import { Router } from 'express';

import reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const reviewRouter = Router();

// 내 리뷰 목록 조회
reviewRouter.get('/', authMiddleware, reviewController.getMyReviews.bind(reviewController));

// 리뷰 상세 조회/수정/삭제
reviewRouter
  .route('/:reviewId')
  .get(reviewController.getReviewById.bind(reviewController))
  .patch(authMiddleware, reviewController.updateReview.bind(reviewController))
  .delete(authMiddleware, reviewController.deleteReview.bind(reviewController));
