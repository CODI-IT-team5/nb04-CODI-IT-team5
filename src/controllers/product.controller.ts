import type { NextFunction, Request, Response } from 'express';

import { STATUS_CODE } from '../constants/constant.js';
import type { CreateProductInput, GetProductListQuery, UpdateProductInput } from '../dtos/product.dto.js';
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

      const input: CreateProductInput = req.body;
      const product = await productService.create(req.user.id, input);
      res.status(STATUS_CODE.CREATED).json(ProductResponse.detail(product));
    } catch (err) {
      next(err);
    }
  };

  // 상품 목록 조회
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: GetProductListQuery = req.query as unknown as GetProductListQuery;
      const userId = req.user?.id;
      const { list, totalCount } = await productService.getList(filters, userId);
      res.status(STATUS_CODE.OK).json(ProductResponse.list(list, totalCount));
    } catch (err) {
      next(err);
    }
  };

  // 상품 상세 조회
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      if (!productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }
      const product = await productService.getById(productId);
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

      const { productId } = req.params;
      if (!productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }
      const input: UpdateProductInput = req.body;
      const product = await productService.update(req.user.id, productId, input);
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

      const { productId } = req.params;
      if (!productId) {
        throw new HttpException({ status: STATUS_CODE.BAD_REQUEST, message: '상품 ID가 필요합니다' });
      }
      await productService.delete(req.user.id, productId);
      res.status(STATUS_CODE.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}

export default new ProductController();
