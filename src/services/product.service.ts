import { STATUS_CODE } from '../constants/constant.js';
import type { CreateProductInput, GetProductListQuery, UpdateProductInput } from '../dtos/product.dto.js';
import { metadataRepository } from '../repositories/metadata.repository.js';
import productRepository from '../repositories/product.repository.js';
import storeRepository from '../repositories/store.repository.js';
import type {
  ProductListItem,
  ProductWithRelations,
  ProductWithStore,
  TransformedProduct,
} from '../types/product.type.js';
import { HttpException } from '../utils/http-exception.js';

class ProductService {
  // 상품 생성
  async create(userId: string, input: CreateProductInput) {
    const store = await this.validateStore(userId);
    const category = await this.validateCategory(input.categoryName);
    await this.validateSizes(input.stocks);

    const productData: { name: string; price: number; content?: string; image?: string } = {
      name: input.name,
      price: input.price,
    };
    if (input.content !== undefined) productData.content = input.content;
    if (input.image !== undefined) productData.image = input.image;

    const product = await productRepository.create(store.id, category.id, productData);

    await productRepository.upsertStocks(product.id, input.stocks);

    if (input.discountRate !== undefined && input.discountStartTime && input.discountEndTime) {
      await productRepository.createDiscount(product.id, {
        discountRate: input.discountRate,
        discountStartTime: new Date(input.discountStartTime),
        discountEndTime: new Date(input.discountEndTime),
      });
    }

    const createdProduct = await productRepository.findByIdWithRelations(product.id);
    if (!createdProduct) {
      throw new HttpException({
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: '상품 생성 후 조회에 실패했습니다.',
      });
    }

    return this.transformProductWithRelations(createdProduct);
  }

  // 상품 목록 조회 (필터링 포함)
  async getList(filters: GetProductListQuery, userId?: string) {
    const { products, totalCount } = await productRepository.findMany(filters, userId);
    const productList: ProductListItem[] = products.map((product) => this.transformProductListItem(product));
    return { list: productList, totalCount };
  }

  // 상품 상세 조회
  async getById(productId: string) {
    const product = await productRepository.findByIdWithRelations(productId);
    if (!product) {
      throw new HttpException({ status: STATUS_CODE.NOT_FOUND, message: '상품을 찾을 수 없습니다.' });
    }

    return this.transformProductWithRelations(product);
  }

  // 상품 수정
  async update(userId: string, productId: string, input: UpdateProductInput) {
    await this.validateProductOwnership(productId, userId);

    const categoryId = input.categoryName ? (await this.validateCategory(input.categoryName)).id : undefined;

    if (input.stocks) {
      await this.validateSizes(input.stocks);
    }

    await productRepository.update(productId, {
      name: input.name,
      price: input.price,
      content: input.content,
      image: input.image,
      categoryId,
      isSoldOut: input.isSoldOut,
    });

    if (input.stocks) {
      await productRepository.upsertStocks(productId, input.stocks);
    }

    if (input.discountRate !== undefined || input.discountStartTime || input.discountEndTime) {
      await productRepository.revokeActiveDiscounts(productId);

      if (input.discountRate !== undefined && input.discountStartTime && input.discountEndTime) {
        await productRepository.createDiscount(productId, {
          discountRate: input.discountRate,
          discountStartTime: new Date(input.discountStartTime),
          discountEndTime: new Date(input.discountEndTime),
        });
      }
    }

    const updatedProduct = await productRepository.findByIdWithRelations(productId);
    if (!updatedProduct) {
      throw new HttpException({
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: '상품 업데이트 후 조회에 실패했습니다.',
      });
    }

    return this.transformProductWithRelations(updatedProduct);
  }

  // 상품 삭제
  async delete(userId: string, productId: string) {
    await this.validateProductOwnership(productId, userId);
    await productRepository.delete(productId);
  }

  // 헬퍼: 스토어 검증
  private async validateStore(userId: string) {
    const store = await storeRepository.findByUserId(userId);
    if (!store) {
      throw new HttpException({
        status: STATUS_CODE.FORBIDDEN,
        message: '스토어가 없습니다. 판매자만 상품을 등록할 수 있습니다.',
      });
    }
    return store;
  }

  // 헬퍼: 카테고리 검증
  private async validateCategory(categoryName: string) {
    const category = await metadataRepository.findCategoryByName(categoryName);
    if (!category) {
      throw new HttpException({ status: STATUS_CODE.NOT_FOUND, message: '카테고리를 찾을 수 없습니다.' });
    }
    return category;
  }

  // 헬퍼: 사이즈 검증
  private async validateSizes(stocks: { sizeId: string; quantity: number }[]) {
    for (const stock of stocks) {
      const size = await metadataRepository.findSizeById(stock.sizeId);
      if (!size) {
        throw new HttpException({
          status: STATUS_CODE.NOT_FOUND,
          message: `사이즈 ID ${stock.sizeId}를 찾을 수 없습니다.`,
        });
      }
    }
  }

  // 헬퍼: 상품 소유자 검증
  private async validateProductOwnership(productId: string, userId: string) {
    const product = await productRepository.findByIdWithStoreOwner(productId);
    if (!product) {
      throw new HttpException({ status: STATUS_CODE.NOT_FOUND, message: '상품을 찾을 수 없습니다.' });
    }
    if (product.store.userId !== userId) {
      throw new HttpException({ status: STATUS_CODE.FORBIDDEN, message: '본인의 상품만 수정/삭제할 수 있습니다.' });
    }
    return product;
  }

  // 헬퍼: 상품 목록 아이템 변환
  private transformProductListItem(product: ProductWithStore): ProductListItem {
    const activeDiscount = this.findActiveDiscount(product.productDiscounts);
    const discountPrice = activeDiscount ? Math.floor(product.price * (1 - activeDiscount.discountRate / 100)) : null;

    return {
      ...product,
      storeName: product.store.name,
      sales: product.salesCount,
      discountPrice,
      discountRate: activeDiscount?.discountRate ?? null,
      discountStartTime: activeDiscount?.discountStartTime ?? null,
      discountEndTime: activeDiscount?.discountEndTime ?? null,
    };
  }

  // 헬퍼: 활성 할인 찾기
  private findActiveDiscount(discounts: ProductWithStore['productDiscounts']) {
    const now = new Date();
    return discounts.find(
      (d) => !d.revokedAt && new Date(d.discountStartTime) <= now && new Date(d.discountEndTime) >= now,
    );
  }

  // 헬퍼: 상품 관계 데이터 변환
  private transformProductWithRelations(product: ProductWithRelations): TransformedProduct {
    const reviewStats = this.calculateReviewStats(product.reviews);
    return {
      ...product,
      reviews: [reviewStats],
      inquiries: product.inquiries,
    };
  }

  // 헬퍼: 리뷰 통계 계산
  private calculateReviewStats(reviews: { rating: number }[]) {
    const stats = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    reviews.forEach((review) => {
      switch (review.rating) {
        case 1:
          stats.rate1Length++;
          break;
        case 2:
          stats.rate2Length++;
          break;
        case 3:
          stats.rate3Length++;
          break;
        case 4:
          stats.rate4Length++;
          break;
        case 5:
          stats.rate5Length++;
          break;
      }
      stats.sumScore += review.rating;
    });

    return stats;
  }
}

export default new ProductService();
