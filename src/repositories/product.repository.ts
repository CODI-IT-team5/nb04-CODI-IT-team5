import { Prisma } from '@prisma/client';

import type {
  CreateDiscountRepositoryInput,
  CreateProductRepositoryInput,
  CreateStockRepositoryInput,
  FindManyProductRepositoryInput,
  UpdateProductRepositoryInput,
  UpdateStockRepositoryInput,
  UpsertStocksRepositoryInput,
} from '../dtos/product.dto.js';
import prisma from '../utils/prisma.js';

class ProductRepository {
  findById = async (productId: string) => {
    return prisma.product.findFirst({
      where: { id: productId },
    });
  };

  findByIdWithStoreOwner = async (productId: string) => {
    return prisma.product.findFirst({
      where: { id: productId },
      include: {
        store: {
          include: {
            user: true,
          },
        },
      },
    });
  };

  findByIdWithRelations = async (productId: string) => {
    return prisma.product.findFirst({
      where: { id: productId },
      include: {
        image: true,
        store: true,
        category: true,
        stocks: {
          include: {
            size: true,
          },
        },
        productDiscounts: {
          where: {
            revokedAt: null,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        inquiries: {
          include: {
            reply: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  findMany = async (input: FindManyProductRepositoryInput) => {
    const { page, pageSize, search, sort, priceMin, priceMax, size, favoriteStore, categoryName } = input.filters;

    const where: Prisma.ProductWhereInput = {};

    // 상품명 검색
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // 가격 범위 필터
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    // 카테고리 필터
    if (categoryName) {
      where.category = {
        name: categoryName,
      };
    }

    // 사이즈 필터
    if (size) {
      where.stocks = {
        some: {
          size: {
            name: size,
          },
          quantity: {
            gt: 0,
          },
        },
      };
    }

    // 찜한 스토어 필터
    if (favoriteStore && input.userId) {
      where.store = {
        likedBy: {
          some: {
            userId: input.userId,
          },
        },
      };
    }

    // 정렬 조건 설정
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sort) {
      case 'mostReviewed':
        orderBy.push({ reviewsCount: 'desc' });
        break;
      case 'recent':
        orderBy.push({ createdAt: 'desc' });
        break;
      case 'lowPrice':
        orderBy.push({ price: 'asc' });
        break;
      case 'highPrice':
        orderBy.push({ price: 'desc' });
        break;
      case 'highRating':
        orderBy.push({ reviewsRating: 'desc' });
        break;
      case 'salesRanking':
        orderBy.push({ salesCount: 'desc' });
        break;
      default:
        orderBy.push({ createdAt: 'desc' });
    }

    const skip = (page - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          image: true,
          store: true,
          productDiscounts: {
            where: {
              revokedAt: null,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, totalCount };
  };

  create = async (input: CreateProductRepositoryInput) => {
    return prisma.product.create({
      data: {
        ...input.data,
        storeId: input.storeId,
        categoryId: input.categoryId,
        isSoldOut: false,
        salesCount: 0,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    });
  };

  update = async (input: UpdateProductRepositoryInput) => {
    return prisma.product.update({
      where: { id: input.productId },
      data: {
        name: input.data.name ?? Prisma.skip,
        price: input.data.price ?? Prisma.skip,
        content: input.data.content ?? Prisma.skip,
        imageId: input.data.imageId ?? Prisma.skip,
        categoryId: input.data.categoryId ?? Prisma.skip,
        isSoldOut: input.data.isSoldOut ?? Prisma.skip,
      },
    });
  };

  delete = async (productId: string) => {
    return prisma.product.delete({
      where: { id: productId },
    });
  };

  createStock = async (input: CreateStockRepositoryInput) => {
    return prisma.productStock.create({
      data: {
        productId: input.productId,
        sizeId: input.sizeId,
        quantity: input.quantity,
      },
    });
  };

  updateStock = async (input: UpdateStockRepositoryInput) => {
    return prisma.productStock.update({
      where: { id: input.stockId },
      data: { quantity: input.quantity },
    });
  };

  deleteStock = async (stockId: string) => {
    return prisma.productStock.delete({
      where: { id: stockId },
    });
  };

  upsertStocks = async (input: UpsertStocksRepositoryInput) => {
    const { productId, stocks } = input;
    const operations = stocks.map((stock) =>
      prisma.productStock.upsert({
        where: {
          productId_sizeId: {
            productId,
            sizeId: stock.sizeId,
          },
        },
        create: {
          productId,
          sizeId: stock.sizeId,
          quantity: stock.quantity,
        },
        update: {
          quantity: stock.quantity,
        },
      }),
    );

    return prisma.$transaction(operations);
  };

  createDiscount = async (input: CreateDiscountRepositoryInput) => {
    return prisma.productDiscount.create({
      data: {
        productId: input.productId,
        ...input.data,
      },
    });
  };

  revokeActiveDiscounts = async (productId: string) => {
    return prisma.productDiscount.updateMany({
      where: {
        productId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  };

  updateProductReviewStats = async (productId: string) => {
    // 해당 상품의 모든 리뷰를 조회하여 통계 계산
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const reviewsCount = reviews.length;
    const reviewsRating =
      reviewsCount > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount) * 10) : 0;

    // Product 테이블 업데이트
    return prisma.product.update({
      where: { id: productId },
      data: {
        reviewsCount,
        reviewsRating,
      },
    });
  };
}

export const productRepository = new ProductRepository();
