import { InquiryStatus, UserRole } from '@prisma/client';

import type { CreateInquiryData, UpdateInquiryData } from '../repositories/inquiryRepository.js';
import inquiryRepository from '../repositories/inquiryRepository.js';
import productRepository from '../repositories/productRepository.js';
import storeRepository from '../repositories/storeRepository.js';
import { HttpException } from '../utils/http-exception.js';

export class InquiryService {
  async createInquiry(data: CreateInquiryData) {
    const product = await productRepository.findById(data.productId);

    if (!product) {
      throw HttpException.notFound();
    }

    return inquiryRepository.create(data);
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
        throw new HttpException({
          status: 403,
          message: '비밀글은 작성자와 판매자만 조회할 수 있습니다.',
        });
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
      throw new HttpException({
        status: 403,
        message: '본인의 문의만 수정할 수 있습니다.',
      });
    }

    if (inquiry.status === InquiryStatus.CompletedAnswer) {
      throw new HttpException({
        status: 409,
        message: '답변이 완료된 문의는 수정할 수 없습니다.',
      });
    }

    return inquiryRepository.update(inquiryId, data);
  }

  async deleteInquiry(inquiryId: string, userId: string) {
    const inquiry = await inquiryRepository.findById(inquiryId);

    if (!inquiry) {
      throw HttpException.notFound();
    }

    if (inquiry.userId !== userId) {
      throw new HttpException({
        status: 403,
        message: '본인의 문의만 삭제할 수 있습니다.',
      });
    }

    return inquiryRepository.delete(inquiryId);
  }
}

export default new InquiryService();
