import { Router } from 'express';

import reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, reviewController.getMyReviews.bind(reviewController));

router.get('/:reviewId', reviewController.getReviewById.bind(reviewController));

router.patch('/:reviewId', authMiddleware, reviewController.updateReview.bind(reviewController));

router.delete('/:reviewId', authMiddleware, reviewController.deleteReview.bind(reviewController));

export default router;
