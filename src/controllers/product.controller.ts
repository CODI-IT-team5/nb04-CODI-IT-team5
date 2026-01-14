import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import type { GetProductListQuery } from '../dtos/product.dto.js';
import { ProductResponse } from '../serializes/product.serialize.js';
import productService from '../services/product.service.js';
import { HttpException } from '../utils/http-exception.js';

class ProductController {
  // 상품 등록
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw HttpException.unauthorized();
      }

      const product = await productService.create({ userId: req.user.id, data: req.body });
      res.status(STATUS_CODE.CREATED).json(ProductResponse.detail(product));
    } catch (err) {
      next(err);
    }
  };

  // 상품 목록 조회
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productService.getList({
        filters: req.validated?.query as GetProductListQuery,
        userId: req.user?.id,
      });
      res.status(STATUS_CODE.OK).json(ProductResponse.list(result.list, result.totalCount));
    } catch (err) {
      next(err);
    }
  };

  // 상품 상세 조회
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.params.productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }
      const product = await productService.getById(req.params.productId as string);
      res.status(STATUS_CODE.OK).json(ProductResponse.detail(product));
    } catch (err) {
      next(err);
    }
  };

  // 상품 수정
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw HttpException.unauthorized();
      }

      if (!req.params.productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }

      const product = await productService.update({
        userId: req.user.id,
        productId: req.params.productId,
        ...req.body,
      });
      res.status(STATUS_CODE.OK).json(ProductResponse.detail(product));
    } catch (err) {
      next(err);
    }
  };

  // 상품 삭제
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw HttpException.unauthorized();
      }

      if (!req.params.productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }
      await productService.delete({ userId: req.user.id, productId: req.params.productId as string });
      res.status(STATUS_CODE.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}

export default new ProductController();
