import reviewRepository from '../repositories/reviewRepository.js';
import type { CreateReviewData, UpdateReviewData } from '../repositories/reviewRepository.js';
import prisma from '../utils/prisma.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors.js';

export class ReviewService {
  // 리뷰 작성 
  async createReview(data: CreateReviewData) {
    if (data.rating < 0 || data.rating > 5) {
      throw new BadRequestError('별점은 0~5 사이의 값이어야 합니다.');
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: data.orderItemId },
      include: {
        order: true,
        product: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundError('주문 항목을 찾을 수 없습니다.');
    }

    
    if (orderItem.order.userId !== data.userId) {
      throw new ForbiddenError('본인이 구매한 상품만 리뷰를 작성할 수 있습니다.');
    }

    
    if (orderItem.productId !== data.productId) {
      throw new BadRequestError('주문 항목과 상품이 일치하지 않습니다.');
    }

    
    const existingReview = await reviewRepository.findByOrderItemId(data.orderItemId);

    if (existingReview) {
      throw new ConflictError('이미 리뷰를 작성한 주문 항목입니다.');
    }

    return reviewRepository.create(data);
  }

  // 리뷰 상세 조회
  async getReviewById(reviewId: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('리뷰를 찾을 수 없습니다.');
    }

    return review;
  }

  // 상품별 리뷰 목록 조회 (평균 별점, 리뷰 개수 포함)
  async getProductReviews(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('상품을 찾을 수 없습니다.');
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
      throw new BadRequestError('별점은 0~5 사이의 값이어야 합니다.');
    }

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenError('본인의 리뷰만 수정할 수 있습니다.');
    }

    return reviewRepository.update(reviewId, data);
  }

  // 리뷰 삭제
  async deleteReview(reviewId: string, userId: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenError('본인의 리뷰만 삭제할 수 있습니다.');
    }

    return reviewRepository.delete(reviewId);
  }
}

export default new ReviewService();
