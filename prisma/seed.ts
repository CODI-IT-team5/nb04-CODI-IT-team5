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
  const seller1Store = await prisma.store.upsert({
    where: { name: '셀러1 스토어' },
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
  // 6. 관심 스토어
  // ----------------------
  await prisma.favoriteStore.upsert({
    where: { userId_storeId: { userId: buyer1.id, storeId: seller1Store.id } },
    update: {},
    create: { userId: buyer1.id, storeId: seller1Store.id },
  });

  // ----------------------
  // 7. 상품 + 재고 (테스트용 더미)
  // ----------------------
  const topCategory = await prisma.category.findFirst({ where: { name: 'TOP' } });

  // 제품이 이미 있으면 재사용, 없으면 생성
  let sweater = await prisma.product.findFirst({
    where: { name: '테스트 스웨터', storeId: seller1Store.id },
  });
  if (!sweater) {
    sweater = await prisma.product.create({
      data: {
        name: '테스트 스웨터',
        content: '따뜻한 테스트 스웨터입니다.',
        price: 30000,
        image: null,
        storeId: seller1Store.id,
        categoryId: topCategory?.id ?? null,
      },
    });
  }

  let hoodie = await prisma.product.findFirst({
    where: { name: '테스트 후디', storeId: seller1Store.id },
  });
  if (!hoodie) {
    hoodie = await prisma.product.create({
      data: {
        name: '테스트 후디',
        content: '편안한 테스트 후디입니다.',
        price: 45000,
        image: null,
        storeId: seller1Store.id,
        categoryId: topCategory?.id ?? null,
      },
    });
  }

  // 사이즈 ID들
  const sizeS = 'size_s';
  const sizeM = 'size_m';
  const sizeL = 'size_l';

  // 스톡 upsert (제품/사이즈 별 유니크 키 존재)
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: sweater.id, sizeId: sizeS } },
    update: { quantity: 20 },
    create: { productId: sweater.id, sizeId: sizeS, quantity: 20 },
  });
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: sweater.id, sizeId: sizeM } },
    update: { quantity: 15 },
    create: { productId: sweater.id, sizeId: sizeM, quantity: 15 },
  });
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: hoodie.id, sizeId: sizeM } },
    update: { quantity: 10 },
    create: { productId: hoodie.id, sizeId: sizeM, quantity: 10 },
  });
  await prisma.productStock.upsert({
    where: { productId_sizeId: { productId: hoodie.id, sizeId: sizeL } },
    update: { quantity: 0 },
    create: { productId: hoodie.id, sizeId: sizeL, quantity: 0 }, // 품절 케이스
  });

  // 편의 출력: 주문 테스트용 ID 참고
  console.log('[seed] 테스트 상품 ID');
  console.log(' - 스웨터:', sweater.id);
  console.log(' - 후디   :', hoodie.id);
  console.log('[seed] 사용 가능한 사이즈 ID: size_s, size_m (size_l는 후디 품절 케이스)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
