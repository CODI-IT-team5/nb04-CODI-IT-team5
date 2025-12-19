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
