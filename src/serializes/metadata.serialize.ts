import type { grade } from '../types/metadata.type.js';

export class MetadataResponse {
  static getGrade(inputs: grade[]) {
    return inputs.map((input) => ({
      name: input.name,
      id: input.id,
      rate: input.rate,
      minAmount: input.minAmount,
    }));
  }
}
