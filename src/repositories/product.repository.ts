import { Prisma } from '@prisma/client';

import type { ProductListFilters, StockInput } from '../types/product.type.js';
import prisma from '../utils/prisma.js';

export class ProductRepository {
  async findById(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId },
    });
  }

  async findByIdWithStoreOwner(productId: string) {
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
  }

  async findByIdWithRelations(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId },
      include: {
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
  }

  async findMany(filters: ProductListFilters, userId?: string) {
    const { page, pageSize, search, sort, priceMin, priceMax, size, favoriteStore, categoryName } = filters;

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
    if (favoriteStore && userId) {
      where.store = {
        likedBy: {
          some: {
            userId,
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
  }

  async create(
    storeId: string,
    categoryId: string | null,
    data: {
      name: string;
      price: number;
      content?: string;
      image?: string;
    },
  ) {
    return prisma.product.create({
      data: {
        ...data,
        storeId,
        categoryId,
        isSoldOut: false,
        salesCount: 0,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    });
  }

  async update(
    productId: string,
    data: {
      name?: string | undefined;
      price?: number | undefined;
      content?: string | undefined;
      image?: string | undefined;
      categoryId?: string | null | undefined;
      isSoldOut?: boolean | undefined;
    },
  ) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name ?? Prisma.skip,
        price: data.price ?? Prisma.skip,
        content: data.content ?? Prisma.skip,
        image: data.image ?? Prisma.skip,
        categoryId: data.categoryId ?? Prisma.skip,
        isSoldOut: data.isSoldOut ?? Prisma.skip,
      },
    });
  }

  async delete(productId: string) {
    return prisma.product.delete({
      where: { id: productId },
    });
  }

  async createStock(productId: string, sizeId: string, quantity: number) {
    return prisma.productStock.create({
      data: {
        productId,
        sizeId,
        quantity,
      },
    });
  }

  async updateStock(stockId: string, quantity: number) {
    return prisma.productStock.update({
      where: { id: stockId },
      data: { quantity },
    });
  }

  async deleteStock(stockId: string) {
    return prisma.productStock.delete({
      where: { id: stockId },
    });
  }

  async upsertStocks(productId: string, stocks: StockInput[]) {
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
  }

  async createDiscount(
    productId: string,
    data: {
      discountRate: number;
      discountStartTime: Date;
      discountEndTime: Date;
    },
  ) {
    return prisma.productDiscount.create({
      data: {
        productId,
        ...data,
      },
    });
  }

  async revokeActiveDiscounts(productId: string) {
    return prisma.productDiscount.updateMany({
      where: {
        productId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export default new ProductRepository();
