import { metadataRepository } from '../repositories/metadata.repository.js';
import { MetadataResponse } from '../serializes/metadata.serialize.js';

class MetadataService {
  gradeList = async () => {
    const results = await metadataRepository.gradeList();
    return MetadataResponse.getGrade(results);
  };
}

export const metadataService = new MetadataService();
