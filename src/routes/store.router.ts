import express from 'express';

import { storeController } from '../controllers/store.controller.js';
import { storeDto } from '../dtos/store.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSeller } from '../middlewares/role.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const storeRouter = express.Router();

// 새 스토어 등록
storeRouter.route('/').post(authMiddleware, requireSeller, validateMiddleware(storeDto.create), storeController.create);

// 내 스토어 상세 조회
storeRouter.route('/detail/my').get(authMiddleware, requireSeller, storeController.getMyStore);

// 내 스토어 등록 상품 조회
storeRouter
  .route('/detail/my/product')
  .get(authMiddleware, requireSeller, validateMiddleware(storeDto.getMyProducts), storeController.getMyProducts);

// 관심 스토어 등록/해제
storeRouter
  .route('/:storeId/favorite')
  .post(authMiddleware, validateMiddleware(storeDto.toggleFavorite), storeController.toggleFavorite)
  .delete(authMiddleware, validateMiddleware(storeDto.toggleFavorite), storeController.toggleFavorite);

// 스토어 상세 조회/수정
storeRouter
  .route('/:storeId')
  .get(validateMiddleware(storeDto.getById), storeController.getById)
  .patch(authMiddleware, requireSeller, validateMiddleware(storeDto.update), storeController.update);
