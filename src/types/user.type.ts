import type { UserRole } from '@prisma/client';

export interface UserBase {
  id: string;
  name: string;
  email: string;
  type: UserRole;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  grade: Grade;
  image: string | null;
}

interface Grade {
  name: string;
  id: string;
  rate: number;
  minAmount: number;
}

export interface UpdateUser {
  userId: string;
  name?: string | undefined;
  password?: string | undefined;
  image?: string | undefined;
}

export interface UpdateUserInput extends UpdateUser {
  currentPassword?: string;
}

export interface likeStores {
  storeId: string;
  userId: string;
  store: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    address: string;
    detailAddress: string | null;
    phoneNumber: string;
    content: string;
    image: string | null;
  };
}

export interface deleteUser {
  userId: string;
  refreshToken: string;
}
