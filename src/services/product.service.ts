import { MESSAGE } from '../constants/constant.js';
import { metadataRepository } from '../repositories/metadata.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import type {
  ProductCreateServiceInput,
  ProductDeleteServiceInput,
  ProductGetListServiceInput,
  ProductListItem,
  ProductOwnershipValidationInput,
  ProductUpdateServiceInput,
  ProductWithRelations,
  ProductWithStore,
  TransformedProduct,
} from '../types/product.type.js';
import { HttpException } from '../utils/http-exception.js';

class ProductService {
  // 상품 생성
  create = async (input: ProductCreateServiceInput) => {
    const store = await this.validateStore(input.userId);
    const category = await this.validateCategory(input.data.categoryName);
    await this.validateSizes(input.data.stocks);

    const productData: { name: string; price: number; content?: string; imageId?: string } = {
      name: input.data.name,
      price: input.data.price,
    };
    if (input.data.content !== undefined) productData.content = input.data.content;
    if (input.data.imageId !== undefined) productData.imageId = input.data.imageId;

    const product = await productRepository.create({
      storeId: store.id,
      categoryId: category.id,
      data: productData,
    });

    await productRepository.upsertStocks({
      productId: product.id,
      stocks: input.data.stocks,
    });

    if (input.data.discountRate !== undefined && input.data.discountStartTime && input.data.discountEndTime) {
      await productRepository.createDiscount({
        productId: product.id,
        data: {
          discountRate: input.data.discountRate,
          discountStartTime: new Date(input.data.discountStartTime),
          discountEndTime: new Date(input.data.discountEndTime),
        },
      });
    }

    const createdProduct = await productRepository.findByIdWithRelations(product.id);
    if (!createdProduct) {
      throw HttpException.notFound(MESSAGE.productCreationFailed);
    }

    return this.transformProductWithRelations(createdProduct);
  };

  // 상품 목록 조회 (필터링 포함)
  getList = async (input: ProductGetListServiceInput) => {
    const result = await productRepository.findMany({ filters: input.filters, userId: input.userId });
    const productList: ProductListItem[] = result.products.map((product) => this.transformProductListItem(product));
    return { list: productList, totalCount: result.totalCount };
  };

  // 상품 상세 조회
  getById = async (productId: string) => {
    const product = await productRepository.findByIdWithRelations(productId);
    if (!product) {
      throw HttpException.notFound(MESSAGE.productNotFound);
    }

    return this.transformProductWithRelations(product);
  };

  // 상품 수정
  update = async (input: ProductUpdateServiceInput) => {
    await this.validateProductOwnership({ productId: input.productId, userId: input.userId });

    const categoryId = input.categoryName ? (await this.validateCategory(input.categoryName)).id : undefined;

    if (input.stocks) {
      await this.validateSizes(input.stocks);
    }

    await productRepository.update({
      productId: input.productId,
      data: {
        name: input.name,
        price: input.price,
        content: input.content,
        imageId: input.imageId,
        categoryId,
        isSoldOut: input.isSoldOut,
      },
    });

    if (input.stocks) {
      await productRepository.upsertStocks({
        productId: input.productId,
        stocks: input.stocks,
      });
    }

    if (input.discountRate !== undefined || input.discountStartTime || input.discountEndTime) {
      await productRepository.revokeActiveDiscounts(input.productId);

      if (input.discountRate !== undefined && input.discountStartTime && input.discountEndTime) {
        await productRepository.createDiscount({
          productId: input.productId,
          data: {
            discountRate: input.discountRate,
            discountStartTime: new Date(input.discountStartTime),
            discountEndTime: new Date(input.discountEndTime),
          },
        });
      }
    }

    // 캐시 무효화 후 다시 조회
    productRepository.invalidateProductCache(input.productId);

    const updatedProduct = await productRepository.findByIdWithRelations(input.productId);
    if (!updatedProduct) {
      throw HttpException.notFound(MESSAGE.productUpdateFailed);
    }

    return this.transformProductWithRelations(updatedProduct);
  };

  // 상품 삭제
  delete = async (input: ProductDeleteServiceInput) => {
    await this.validateProductOwnership({ productId: input.productId, userId: input.userId });
    productRepository.invalidateProductCache(input.productId);
    await productRepository.delete(input.productId);
  };

  // 스토어 검증
  private validateStore = async (userId: string) => {
    const store = await storeRepository.findByUserId(userId);
    if (!store) {
      throw HttpException.forbidden(MESSAGE.storeNotFound);
    }
    return store;
  };

  // 카테고리 검증
  private validateCategory = async (categoryName: string) => {
    const category = await metadataRepository.findCategoryByName(categoryName);
    if (!category) {
      throw HttpException.notFound(MESSAGE.categoryNotFound);
    }
    return category;
  };

  // 사이즈 검증
  private validateSizes = async (stocks: { sizeId: number; quantity: number }[]) => {
    for (const stock of stocks) {
      const size = await metadataRepository.findSizeById(stock.sizeId);
      if (!size) {
        throw HttpException.notFound(MESSAGE.sizeNotFound);
      }
    }
  };

  // 상품 소유자 검증
  private validateProductOwnership = async (input: ProductOwnershipValidationInput) => {
    const product = await productRepository.findByIdWithStoreOwner(input.productId);
    if (!product) {
      throw HttpException.notFound(MESSAGE.productNotFound);
    }
    if (product.store.userId !== input.userId) {
      throw HttpException.forbidden(MESSAGE.productOwnershipRequired);
    }
    return product;
  };

  // 상품 목록 아이템 변환
  private transformProductListItem = (product: ProductWithStore): ProductListItem => {
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
  };

  // 활성 할인 찾기
  private findActiveDiscount = (discounts: ProductWithStore['productDiscounts']) => {
    const now = new Date();
    return discounts.find(
      (d) => !d.revokedAt && new Date(d.discountStartTime) <= now && new Date(d.discountEndTime) >= now,
    );
  };

  // 상품 관계 데이터 변환
  private transformProductWithRelations = (product: ProductWithRelations): TransformedProduct => {
    const reviewStats = this.calculateReviewStats(product.reviews);
    return {
      ...product,
      reviews: reviewStats,
      inquiries: product.inquiries,
    };
  };

  // 리뷰 통계 계산
  private calculateReviewStats = (reviews: { rating: number }[]) => {
    const stats = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    let totalRating = 0;

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
      totalRating += review.rating;
    });

    // sumScore는 평균 별점 (소수점 첫째자리까지)
    stats.sumScore = reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0;

    return stats;
  };
}

export default new ProductService();
