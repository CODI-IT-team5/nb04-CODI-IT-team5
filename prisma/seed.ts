import { config } from '../src/config/config.js';
import prisma from '../src/utils/prisma.js';

import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  // ----------------------
  // 1. 임시 리소스
  // ----------------------
  await prisma.image.create({
    data: {
      id: 'tmp-image',
      key: config.resource.tmpImageKey,
      url: config.resource.tmpImageUrl,
    },
  });

  // ----------------------
  // 2. 등급
  // ----------------------
  await prisma.grade.createMany({
    data: [
      { id: 'grade_green', name: 'Green', rate: 1, minAmount: 0 },
      { id: 'grade_orange', name: 'Orange', rate: 3, minAmount: 100000 },
      { id: 'grade_red', name: 'Red', rate: 5, minAmount: 300000 },
      { id: 'grade_black', name: 'Black', rate: 7, minAmount: 500000 },
      { id: 'grade_vip', name: 'VIP', rate: 10, minAmount: 1000000 },
    ],
    skipDuplicates: true,
  });
  // ----------------------
  // 3. 유저
  // ----------------------

  const testPassword = 'test1234';
  const hashedPassword = await bcrypt.hash(testPassword, config.app.bcryptSaltRounds);

  const [seller1, buyer1] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'seller1@test.com' },
      update: {},
      create: {
        email: 'seller1@test.com',
        name: '셀러1',
        password: hashedPassword,
        lastLoginAt: new Date(),
        type: UserRole.SELLER,
        gradeId: 'grade_green',
      },
    }),
    prisma.user.upsert({
      where: { email: 'buyer1@test.com' },
      update: {},
      create: {
        email: 'buyer1@test.com',
        name: '바이어1',
        password: hashedPassword,
        lastLoginAt: new Date(),
        type: UserRole.BUYER,
        gradeId: 'grade_green',
      },
    }),
  ]);

  // ----------------------
  // 4. 카테고리
  // ----------------------
  await prisma.category.createMany({
    data: [
      { name: 'TOP' },
      { name: 'BOTTOM' },
      { name: 'OUTER' },
      { name: 'DRESS' },
      { name: 'SKIRT' },
      { name: 'SHOES' },
      { name: 'ACC' },
    ],
    skipDuplicates: true,
  });

  // ----------------------
  // 5. 사이즈
  // ----------------------
  await prisma.size.createMany({
    data: [
      { id: 'size_free', name: 'Free', sizeDetail: { ko: '프리사이즈', en: 'Free' } },
      { id: 'size_s', name: 'S', sizeDetail: { ko: '스몰', en: 'Small' } },
      { id: 'size_m', name: 'M', sizeDetail: { ko: '미디움', en: 'Medium' } },
      { id: 'size_l', name: 'L', sizeDetail: { ko: '라지', en: 'Large' } },
      { id: 'size_xl', name: 'XL', sizeDetail: { ko: '엑스라지', en: 'X-Large' } },
    ],
    skipDuplicates: true,
  });

  // ----------------------
  // 6. 스토어
  // ----------------------
  const seller1Store = await prisma.store.upsert({
    where: { userId: seller1.id },
    update: {},
    create: {
      name: '셀러1 스토어',
      content: '셀러1 스토어 소개',
      address: '서울시 강남구',
      detailAddress: '테헤란로 1',
      phoneNumber: '010-1111-1111',
      userId: seller1.id,
    },
  });

  // ----------------------
  // 7. 관심 스토어
  // ----------------------
  await prisma.favoriteStore.upsert({
    where: { userId_storeId: { userId: buyer1.id, storeId: seller1Store.id } },
    update: {},
    create: { userId: buyer1.id, storeId: seller1Store.id },
  });

  // ----------------------
  // 8. 상품 (Notification 테스트용)
  // ----------------------

  const topCategory = await prisma.category.findFirst({
    where: { name: 'TOP' },
  });

  const testProduct = await prisma.product.upsert({
    where: { id: 'testProductId' },
    update: {},
    create: {
      id: 'testProductId',
      storeId: seller1Store.id,
      categoryId: topCategory!.id,
      name: '[테스트] 자켓',
      price: 50000,
      content: '이 상품에 문의를 남겨서 판매자 알림을 테스트해보세요.',
      isSoldOut: false,
    },
  });

  // ----------------------
  // 9. 재고 추가 (테스트용)
  // ----------------------
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: testProduct.id, sizeId: 'size_s' } },
    update: { quantity: 10 },
    create: { productId: testProduct.id, sizeId: 'size_s', quantity: 10 },
  });
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: testProduct.id, sizeId: 'size_m' } },
    update: { quantity: 10 },
    create: { productId: testProduct.id, sizeId: 'size_m', quantity: 10 },
  });

  console.log(' 테스트용 상품 및 재고 생성 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
