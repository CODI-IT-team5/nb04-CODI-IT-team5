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
  // 7. 상품 + 재고 (대시보드/장바구니/주문 테스트용)
  // ----------------------
  const topCategory = await prisma.category.findFirst({ where: { name: 'TOP' } });

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

  const sizeS = 'size_s';
  const sizeM = 'size_m';
  const sizeL = 'size_l';

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
    create: { productId: hoodie.id, sizeId: sizeL, quantity: 0 },
  });

  console.log('[seed] 테스트 상품 ID');
  console.log(' - 스웨터:', sweater.id);
  console.log(' - 후디   :', hoodie.id);
  console.log('[seed] 사용 가능한 사이즈 ID: size_s, size_m (size_l는 후디 품절 케이스)');

  // ----------------------
  // 8. 대시보드 검증용 주문 샘플 (중복 방지)
  // ----------------------
  const seedOrderExists = await prisma.order.count({
    where: { email: buyer1.email, name: { startsWith: '대시보드 샘플' } },
  });

  if (seedOrderExists === 0) {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    type Item = { productId: string; sizeId: string; quantity: number; price: number; productName: string };
    const makeItems = (items: Array<{ p: 'sweater' | 'hoodie'; sizeId: string; quantity: number }>): Item[] =>
      items.map((it) => ({
        productId: it.p === 'sweater' ? sweater!.id : hoodie!.id,
        sizeId: it.sizeId,
        quantity: it.quantity,
        price: it.p === 'sweater' ? 30000 : 45000,
        productName: it.p === 'sweater' ? '테스트 스웨터' : '테스트 후디',
      }));

    const seedOrders: Array<{ name: string; createdAt: Date; items: Item[] }> = [
      { name: '대시보드 샘플 1', createdAt: daysAgo(0), items: makeItems([{ p: 'sweater', sizeId: sizeS, quantity: 1 }]) },
      { name: '대시보드 샘플 2', createdAt: daysAgo(1), items: makeItems([{ p: 'hoodie', sizeId: sizeM, quantity: 2 }]) },
      { name: '대시보드 샘플 3', createdAt: daysAgo(3), items: makeItems([{ p: 'sweater', sizeId: sizeM, quantity: 3 }]) },
      { name: '대시보드 샘플 4', createdAt: daysAgo(20), items: makeItems([{ p: 'hoodie', sizeId: sizeM, quantity: 1 }]) },
      { name: '대시보드 샘플 5', createdAt: daysAgo(200), items: makeItems([{ p: 'sweater', sizeId: sizeS, quantity: 4 }]) },
    ];

    let sweaterSold = 0;
    let hoodieSold = 0;

    for (const so of seedOrders) {
      const subtotal = so.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = await prisma.order.create({
        data: {
          userId: buyer1.id,
          email: buyer1.email,
          name: so.name,
          phoneNumber: '010-2222-3333',
          address: '서울시 강남구 [seed]',
          subtotal,
          usePoint: 0,
          status: 'CompletedPayment',
          createdAt: so.createdAt,
          orderItems: {
            create: so.items.map((i) => ({
              quantity: i.quantity,
              price: i.price,
              productName: i.productName,
              product: { connect: { id: i.productId } },
              size: { connect: { id: i.sizeId } },
            })),
          },
          payment: {
            create: { price: subtotal, status: 'CompletedPayment', createdAt: so.createdAt },
          },
        },
      });

      so.items.forEach((i) => {
        if (i.productId === sweater!.id) sweaterSold += i.quantity;
        if (i.productId === hoodie!.id) hoodieSold += i.quantity;
      });

      console.log(`[seed] 생성된 주문: ${order.id} (${so.name})`);
    }

    if (sweaterSold > 0) {
      await prisma.product.update({ where: { id: sweater.id }, data: { salesCount: { increment: sweaterSold } } });
    }
    if (hoodieSold > 0) {
      await prisma.product.update({ where: { id: hoodie.id }, data: { salesCount: { increment: hoodieSold } } });
    }

    console.log('[seed] 대시보드 샘플 주문 생성 완료');
  } else {
    console.log('[seed] 대시보드 샘플 주문이 이미 존재하여 건너뜀');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
