import { Router } from 'express';

import reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, reviewController.getMyReviews.bind(reviewController));

router.get('/:reviewId', reviewController.getReviewById.bind(reviewController));

router.patch('/:reviewId', authenticate, reviewController.updateReview.bind(reviewController));

router.delete('/:reviewId', authenticate, reviewController.deleteReview.bind(reviewController));

export default router;
