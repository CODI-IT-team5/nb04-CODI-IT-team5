import type { Image } from '@prisma/client';

export class S3Response {
  static base(image: Image) {
    return {
      url: image.url,
      key: image.key,
      id: image.id,
    };
  }
}
