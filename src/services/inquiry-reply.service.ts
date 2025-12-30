import { InquiryStatus, NotificationType } from '@prisma/client';

import inquiryRepository from '../repositories/inquiry.repository.js';
import inquiryReplyRepository from '../repositories/inquiry-reply.repository.js';
import storeRepository from '../repositories/store.repository.js';
import { HttpException } from '../utils/http-exception.js';
import logger from '../utils/logger.js';
import { notificationService } from './notification.service.js';

export class InquiryReplyService {
  async createReply(inquiryId: string, userId: string, content: string) {
    const inquiry = await inquiryRepository.findById(inquiryId);

    if (!inquiry) {
      throw HttpException.notFound();
    }

    const store = await storeRepository.findByUserId(userId);

    if (!store) {
      throw HttpException.notFound();
    }

    // 판매자 검증: 자신의 스토어 상품에 대한 문의만 답변 가능
    const inquiryWithProduct = inquiry as typeof inquiry & {
      product?: { storeId: string };
    };
    if (inquiryWithProduct.product?.storeId !== store.id) {
      throw HttpException.forbidden('자신의 상품에 대한 문의만 답변할 수 있습니다.');
    }

    // 중복 답변 방지
    const existingReply = await inquiryReplyRepository.findByInquiryId(inquiryId);

    if (existingReply) {
      throw HttpException.conflict('이미 답변이 등록된 문의입니다.');
    }

    const reply = await inquiryReplyRepository.create({
      content,
      inquiryId,
      userId,
    });

    // 문의 작성자에게 답변 등록 알림 전송
    try {
      await notificationService.createNotification({
        userId: inquiry.userId, // 문의를 작성한 유저의 ID
        type: NotificationType.INQUIRY_REPLIED_FOR_BUYER,
        content: '회원님의 문의에 답변이 등록되었습니다.',
        url: `/inquiries/${inquiry.id}`,
      });
    } catch (error) {
      logger.error(error as Error, '문의 답변 알림 전송 실패:');
    }

    // 문의 상태 업데이트: WaitingAnswer → CompletedAnswer
    await inquiryRepository.updateStatus(inquiryId, InquiryStatus.CompletedAnswer);

    return reply;
  }

  // 답변 상세 조회
  async getReplyById(replyId: string) {
    const reply = await inquiryReplyRepository.findById(replyId);

    if (!reply) {
      throw HttpException.notFound();
    }

    return reply;
  }

  // 답변 수정
  async updateReply(replyId: string, userId: string, content: string) {
    const reply = await inquiryReplyRepository.findById(replyId);

    if (!reply) {
      throw HttpException.notFound();
    }

    if (reply.userId !== userId) {
      throw HttpException.forbidden('본인의 답변만 수정할 수 있습니다.');
    }

    return inquiryReplyRepository.update(replyId, { content });
  }

  async deleteReply(replyId: string, userId: string) {
    const reply = await inquiryReplyRepository.findById(replyId);

    if (!reply) {
      throw HttpException.notFound();
    }

    if (reply.userId !== userId) {
      throw HttpException.forbidden('본인의 답변만 삭제할 수 있습니다.');
    }

    // 문의 상태 복구: CompletedAnswer → WaitingAnswer
    await inquiryRepository.updateStatus(reply.inquiryId, InquiryStatus.WaitingAnswer);

    return inquiryReplyRepository.delete(replyId);
  }
}

export default new InquiryReplyService();
