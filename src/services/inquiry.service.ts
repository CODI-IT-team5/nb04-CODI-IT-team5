import { InquiryStatus, NotificationType, UserRole } from '@prisma/client';

import type { CreateInquiryData, UpdateInquiryData } from '../repositories/inquiry.repository.js';
import inquiryRepository from '../repositories/inquiry.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';
import { notificationService } from './notification.service.js';

export class InquiryService {
  async createInquiry(data: CreateInquiryData) {
    const productForCheck = await productRepository.findById(data.productId);

    if (!productForCheck) {
      throw HttpException.notFound();
    }

    const inquiry = await inquiryRepository.create(data);

    // 문의 생성 후 판매자에게 알림 전송
    try {
      const product = await productRepository.findByIdWithStoreOwner(inquiry.productId);
      const sellerId = product?.store?.userId;

      if (sellerId) {
        await notificationService.createNotification({
          userId: sellerId,
          type: NotificationType.NEW_INQUIRY_FOR_SELLER,
          content: '판매 중인 상품에 새로운 문의가 등록되었습니다.',
          url: `/seller/inquiries/${inquiry.id}`,
        });
      }
    } catch (error) {
      logger.error(error as Error, '새 문의 알림 전송 실패:');
    }

    return inquiry;
  }

  async getInquiryById(inquiryId: string, userId: string, userType: UserRole) {
    const inquiry = await inquiryRepository.findById(inquiryId);

    if (!inquiry) {
      throw HttpException.notFound();
    }

    // 비밀글 권한 체크
    if (inquiry.isSecret) {
      const isAuthor = inquiry.userId === userId;
      const inquiryWithProduct = inquiry as typeof inquiry & {
        product?: { store?: { userId: string } };
      };
      const isSeller = userType === UserRole.SELLER && inquiryWithProduct.product?.store?.userId === userId;

      if (!isAuthor && !isSeller) {
        throw HttpException.forbidden('비밀글은 작성자와 판매자만 조회할 수 있습니다.');
      }
    }

    return inquiry;
  }

  async getMyInquiries(userId: string, userType: UserRole) {
    if (userType === UserRole.BUYER) {
      return inquiryRepository.findByUserId(userId);
    } else {
      const store = await storeRepository.findByUserId(userId);

      if (!store) {
        throw HttpException.notFound();
      }

      return inquiryRepository.findByStoreId(store.id);
    }
  }

  async getProductInquiries(productId: string) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw HttpException.notFound();
    }

    return inquiryRepository.findByProductId(productId);
  }

  async updateInquiry(inquiryId: string, userId: string, data: UpdateInquiryData) {
    const inquiry = await inquiryRepository.findById(inquiryId);

    if (!inquiry) {
      throw HttpException.notFound();
    }

    if (inquiry.userId !== userId) {
      throw HttpException.forbidden('본인의 문의만 수정할 수 있습니다.');
    }

    if (inquiry.status === InquiryStatus.CompletedAnswer) {
      throw HttpException.conflict('답변이 완료된 문의는 수정할 수 없습니다.');
    }

    return inquiryRepository.update(inquiryId, data);
  }

  async deleteInquiry(inquiryId: string, userId: string) {
    const inquiry = await inquiryRepository.findById(inquiryId);

    if (!inquiry) {
      throw HttpException.notFound();
    }

    if (inquiry.userId !== userId) {
      throw HttpException.forbidden('본인의 문의만 삭제할 수 있습니다.');
    }

    return inquiryRepository.delete(inquiryId);
  }
}

export default new InquiryService();
