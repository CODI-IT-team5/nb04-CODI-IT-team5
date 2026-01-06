import { Prisma } from '@prisma/client';

import type {
  CreateStoreServiceInput,
  GetMyProductsInput,
  ToggleFavoriteInput,
  UpdateStoreServiceInput,
} from '../types/store.type.js';
import prisma from '../utils/prisma.js';

class StoreRepository {
  async findByUserId(userId: string) {
    return prisma.store.findFirst({
      where: { userId },
    });
  }

  async findByName(name: string) {
    return prisma.store.findFirst({
      where: { name },
    });
  }

  async findById(storeId: string) {
    return prisma.store.findFirst({
      where: { id: storeId },
    });
  }

  async findByIdWithDetails(storeId: string) {
    const favoriteCount = await prisma.favoriteStore.count({
      where: { storeId },
    });

    const store = await prisma.store.findFirst({
      where: { id: storeId },
    });

    if (!store) return null;

    return {
      ...store,
      favoriteCount,
    };
  }

  async findMyStoreWithDetails(userId: string) {
    const store = await prisma.store.findFirst({
      where: { userId },
    });

    if (!store) return null;

    const [productCount, favoriteCount, monthFavoriteCount, totalSoldCount] = await Promise.all([
      prisma.product.count({
        where: { storeId: store.id },
      }),
      prisma.favoriteStore.count({
        where: { storeId: store.id },
      }),
      prisma.favoriteStore.count({
        where: {
          storeId: store.id,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.orderItem.aggregate({
        where: {
          product: {
            storeId: store.id,
          },
          order: {
            status: {
              in: ['Delivered', 'CompletedPayment'],
            },
          },
        },
        _sum: {
          quantity: true,
        },
      }),
    ]);

    return {
      ...store,
      productCount,
      favoriteCount,
      monthFavoriteCount,
      totalSoldCount: totalSoldCount._sum?.quantity ?? 0,
    };
  }

  async getMyProducts(input: GetMyProductsInput) {
    const store = await prisma.store.findFirst({
      where: { userId: input.userId },
    });

    if (!store) return { list: [], totalCount: 0 };

    const skip = (input.page - 1) * input.pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          image: true,
          name: true,
          price: true,
          createdAt: true,
          productDiscounts: {
            select: {
              discountRate: true,
              discountStartTime: true,
              discountEndTime: true,
              revokedAt: true,
            },
          },
          stocks: {
            select: {
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: input.pageSize,
      }),
      prisma.product.count({
        where: { storeId: store.id },
      }),
    ]);

    const list = products.map((product) => {
      const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const now = new Date();
      const activeDiscount = product.productDiscounts.find(
        (d) => !d.revokedAt && d.discountStartTime <= now && d.discountEndTime >= now,
      );

      return {
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.price,
        stock: totalStock,
        isDiscount: !!activeDiscount,
        createdAt: product.createdAt,
        isSoldOut: totalStock === 0,
      };
    });

    return { list, totalCount };
  }

  async create(input: CreateStoreServiceInput) {
    return prisma.store.create({
      data: {
        name: input.name,
        address: input.address,
        detailAddress: input.detailAddress ?? Prisma.skip,
        phoneNumber: input.phoneNumber,
        content: input.content,
        image: input.image ?? Prisma.skip,
        userId: input.userId,
      },
    });
  }

  async update(input: UpdateStoreServiceInput) {
    return prisma.store.update({
      where: { id: input.storeId },
      data: {
        name: input.name ?? Prisma.skip,
        address: input.address ?? Prisma.skip,
        detailAddress: input.detailAddress ?? Prisma.skip,
        phoneNumber: input.phoneNumber ?? Prisma.skip,
        content: input.content ?? Prisma.skip,
        image: input.image ?? Prisma.skip,
      },
    });
  }

  async toggleFavorite(input: ToggleFavoriteInput) {
    const existingFavorite = await prisma.favoriteStore.findUnique({
      where: {
        userId_storeId: {
          userId: input.userId,
          storeId: input.storeId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favoriteStore.delete({
        where: {
          userId_storeId: {
            userId: input.userId,
            storeId: input.storeId,
          },
        },
      });
      return { type: 'delete' as const };
    } else {
      await prisma.favoriteStore.create({
        data: {
          userId: input.userId,
          storeId: input.storeId,
        },
      });
      return { type: 'register' as const };
    }
  }
}

export const storeRepository = new StoreRepository();
