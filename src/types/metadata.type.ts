import type { ExtendedTransactionClient } from '../utils/prisma.js';
export interface grade {
  name: string;
  id: string;
  rate: number;
  minAmount: number;
}

export interface UpdateGrade {
  userId: string;
  newTotalAmount: number;
  newGradeId: string;
}

export interface UpdateGradeServiceInput {
  userId: string;
  deltaAmount: number;
}

export interface IncrementTotalAmountInput {
  userId: string;
  deltaAmount: number;
  tx: ExtendedTransactionClient;
}

export interface UpdateGradeInput {
  userId: string;
  gradeId: string;
  tx: ExtendedTransactionClient;
}
