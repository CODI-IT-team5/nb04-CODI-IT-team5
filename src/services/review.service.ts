import orderItemRepository from '../repositories/order-item.repository.js';
import productRepository from '../repositories/product.repository.js';
import type { CreateReviewData, UpdateReviewData } from '../repositories/review.repository.js';
import reviewRepository from '../repositories/review.repository.js';
import { HttpException } from '../utils/http-exception.js';

export class ReviewService {
  // 리뷰 작성
  async createReview(data: CreateReviewData) {
    if (data.rating < 0 || data.rating > 5) {
      throw HttpException.badRequest('별점은 0~5 사이의 값이어야 합니다.');
    }

    const orderItem = await orderItemRepository.findByIdWithRelations(data.orderItemId);

    if (!orderItem) {
      throw HttpException.notFound();
    }

    if (orderItem.order.userId !== data.userId) {
      throw HttpException.forbidden('본인이 구매한 상품만 리뷰를 작성할 수 있습니다.');
    }

    if (orderItem.productId !== data.productId) {
      throw HttpException.badRequest('주문 항목과 상품이 일치하지 않습니다.');
    }

    const existingReview = await reviewRepository.findByOrderItemId(data.orderItemId);

    if (existingReview) {
      throw HttpException.conflict('이미 리뷰를 작성한 주문 항목입니다.');
    }

    return reviewRepository.create(data);
  }

  // 리뷰 상세 조회
  async getReviewById(reviewId: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw HttpException.notFound();
    }

    return review;
  }

  // 상품별 리뷰 목록 조회 (평균 별점, 리뷰 개수 포함)
  async getProductReviews(productId: string) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw HttpException.notFound();
    }

    const reviews = await reviewRepository.findByProductId(productId);
    const averageRating = await reviewRepository.getAverageRating(productId);
    const reviewCount = await reviewRepository.getReviewCount(productId);

    return {
      reviews,
      averageRating,
      reviewCount,
    };
  }

  // 내가 작성한 리뷰 목록 조회
  async getMyReviews(userId: string) {
    return reviewRepository.findByUserId(userId);
  }

  // 리뷰 수정
  async updateReview(reviewId: string, userId: string, data: UpdateReviewData) {
    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
      throw HttpException.badRequest('별점은 0~5 사이의 값이어야 합니다.');
    }

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw HttpException.notFound();
    }

    if (review.userId !== userId) {
      throw HttpException.forbidden('본인의 리뷰만 수정할 수 있습니다.');
    }

    return reviewRepository.update(reviewId, data);
  }

  // 리뷰 삭제
  async deleteReview(reviewId: string, userId: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw HttpException.notFound();
    }

    if (review.userId !== userId) {
      throw HttpException.forbidden('본인의 리뷰만 삭제할 수 있습니다.');
    }

    return reviewRepository.delete(reviewId);
  }
}

export default new ReviewService();
