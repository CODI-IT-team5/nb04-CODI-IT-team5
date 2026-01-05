import { Prisma, UserRole } from '@prisma/client';

import storeRepository from '../repositories/store.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type {
  CreateStoreServiceInput,
  GetMyProductsInput,
  GetStoreByIdInput,
  ToggleFavoriteInput,
  UpdateStoreServiceInput,
} from '../types/store.type.js';
import { HttpException } from '../utils/http-exception.js';

class StoreService {
  create = async (input: CreateStoreServiceInput) => {
    const user = await userRepository.getById(input.userId);
    if (!user) throw HttpException.userNotFound();

    if (user.type !== UserRole.SELLER) {
      throw HttpException.forbidden('판매자만 스토어를 등록할 수 있습니다');
    }

    const existingStore = await storeRepository.findByUserId(input.userId);
    if (existingStore) {
      throw HttpException.badRequest('이미 등록된 스토어가 있습니다');
    }

    try {
      const store = await storeRepository.create(input);
      return store;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw HttpException.badRequest('이미 사용 중인 스토어 이름입니다');
      }
      throw err;
    }
  };

  update = async (input: UpdateStoreServiceInput) => {
    const store = await storeRepository.findById(input.storeId);
    if (!store) {
      throw HttpException.notFound('스토어를 찾을 수 없습니다');
    }

    if (store.userId !== input.userId) {
      throw HttpException.forbidden('본인의 스토어만 수정할 수 있습니다');
    }

    if (input.name && input.name !== store.name) {
      const existingStore = await storeRepository.findByName(input.name);
      if (existingStore && existingStore.id !== input.storeId) {
        throw HttpException.badRequest('이미 사용 중인 스토어 이름입니다');
      }
    }

    try {
      const updatedStore = await storeRepository.update(input);
      return updatedStore;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw HttpException.badRequest('이미 사용 중인 스토어 이름입니다');
      }
      throw err;
    }
  };

  getById = async (input: GetStoreByIdInput) => {
    const store = await storeRepository.findByIdWithDetails(input);
    if (!store) {
      throw HttpException.notFound('스토어를 찾을 수 없습니다');
    }
    return store;
  };

  getMyStore = async (userId: string) => {
    const store = await storeRepository.findMyStoreWithDetails(userId);
    if (!store) {
      throw HttpException.notFound('스토어를 찾을 수 없습니다');
    }
    return store;
  };

  getMyProducts = async (input: GetMyProductsInput) => {
    return storeRepository.getMyProducts(input);
  };

  toggleFavorite = async (input: ToggleFavoriteInput) => {
    const store = await storeRepository.findById(input.storeId);
    if (!store) {
      throw HttpException.notFound('스토어를 찾을 수 없습니다');
    }

    const result = await storeRepository.toggleFavorite(input);

    return {
      type: result.type,
      store,
    };
  };
}

export const storeService = new StoreService();
