import { Router } from 'express';

import inquiryController from '../controllers/inquiry.controller.js';
import productController from '../controllers/product.controller.js';
import {
  createProductDto,
  deleteProductDto,
  getProductByIdDto,
  getProductListDto,
  updateProductDto,
} from '../dtos/product.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireBuyer, requireSeller } from '../middlewares/role.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const productRouter = Router();

// 새 상품 등록/목록 조회
productRouter
  .route('/')
  .post(authMiddleware, requireSeller, validateMiddleware(createProductDto), productController.create)
  .get(validateMiddleware(getProductListDto), productController.getList);

// 상품 정보 조회/수정/삭제
productRouter
  .route('/:productId')
  .get(validateMiddleware(getProductByIdDto), productController.getById)
  .patch(authMiddleware, requireSeller, validateMiddleware(updateProductDto), productController.update)
  .delete(authMiddleware, requireSeller, validateMiddleware(deleteProductDto), productController.delete);

// 상품 문의 등록/조회
productRouter
  .route('/:productId/inquiries')
  .post(authMiddleware, requireBuyer, inquiryController.createInquiry.bind(inquiryController))
  .get(inquiryController.getProductInquiries.bind(inquiryController));
