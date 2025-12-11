import type { NextFunction, Request, Response } from 'express';

import reviewService from '../services/reviewService.js';
import { sendSuccess } from '../utils/response.js';

export class ReviewController {
  // 리뷰 작성
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { rating, content, orderItemId } = req.body;
      const userId = req.user!.id;

      const review = await reviewService.createReview({
        rating: rating as number,
        content: content as string,
        userId,
        productId: productId as string,
        orderItemId: orderItemId as string,
      });

      sendSuccess(res, review, 201, '리뷰가 작성되었습니다.');
    } catch (error) {
      next(error);
    }
  }

  // 리뷰 상세 조회
  async getReviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewId } = req.params;

      const review = await reviewService.getReviewById(reviewId as string);

      sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }

  // 상품별 리뷰 조회
  async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;

      const result = await reviewService.getProductReviews(productId as string);

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // 내 리뷰 조회
  async getMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const reviews = await reviewService.getMyReviews(userId);

      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  // 리뷰 수정
  async updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { rating, content } = req.body;
      const userId = req.user!.id;

      const review = await reviewService.updateReview(reviewId as string, userId, {
        rating,
        content,
      });

      sendSuccess(res, review, 200, '리뷰가 수정되었습니다.');
    } catch (error) {
      next(error);
    }
  }

  // 리뷰 삭제
  async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewId } = req.params;
      const userId = req.user!.id;

      await reviewService.deleteReview(reviewId as string, userId);

      sendSuccess(res, null, 200, '리뷰가 삭제되었습니다.');
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
