import { config } from '../src/config/config.js';
import prisma from '../src/utils/prisma.js';

import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  // ----------------------
  // 1. 등급
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
  // 2. 유저
  // ----------------------

  const testPassword = 'test1234';
  const hashedPassword = await bcrypt.hash(testPassword, config.app.bcryptSaltRounds);

  const [seller1, buyer1] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'seller1@test.com',
        name: '셀러1',
        password: hashedPassword,
        lastLoginAt: new Date(),
        type: UserRole.SELLER,
        gradeId: 'grade_green',
      },
    }),
    prisma.user.create({
      data: {
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
  // 3. 카테고리
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
  // 4. 사이즈
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
  // 5. 스토어
  // ----------------------
  const seller1Store = await prisma.store.create({
    data: {
      name: '셀러1 스토어',
      content: '셀러1 스토어 소개',
      address: '서울시 강남구',
      detailAddress: '테헤란로 1',
      phoneNumber: '010-1111-1111',
      userId: seller1.id,
    },
  });

  // ----------------------
  // 6. 관심 스토어
  // ----------------------
  await prisma.favoriteStore.create({
    data: {
      userId: buyer1.id,
      storeId: seller1Store.id,
    },
  });

  // ----------------------
  // 7. 상품 (Notification 테스트용)
  // ----------------------

  const topCategory = await prisma.category.findFirst({
    where: { name: 'TOP' },
  });

  const testProduct = await prisma.product.create({
    data: {
      storeId: seller1Store.id,
      categoryId: topCategory!.id,
      name: '[테스트] 자켓',
      price: 50000,
      content: '이 상품에 문의를 남겨서 판매자 알림을 테스트해보세요.',
      isSoldOut: false,
    },
  });
  console.log(' 테스트용 상품 생성 완료!');
  console.log(` Product ID: ${testProduct.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
