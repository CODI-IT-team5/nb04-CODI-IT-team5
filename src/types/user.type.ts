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
