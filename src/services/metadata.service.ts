import { metadataRepository } from '../repositories/metadata.repository.js';
import { MetadataResponse } from '../serializes/metadata.serialize.js';

class MetadataService {
  list = async () => {
    const results = await metadataRepository.list();
    return MetadataResponse.getGrade(results);
  };
}

export const metadataService = new MetadataService();
