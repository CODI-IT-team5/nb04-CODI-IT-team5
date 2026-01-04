import type { CreateStoreDto, UpdateStoreDto } from '../dtos/store.dto.js';

export interface CreateStoreServiceInput extends CreateStoreDto {
  userId: string;
}

export interface UpdateStoreServiceInput extends UpdateStoreDto {
  storeId: string;
  userId: string;
}

export interface GetStoreByIdInput {
  storeId: string;
  userId?: string;
}

export interface ToggleFavoriteInput {
  storeId: string;
  userId: string;
}

export interface GetMyProductsInput {
  page: number;
  pageSize: number;
  userId: string;
}
