import { config } from '../src/config/config.js';
import { productRepository } from '../src/repositories/product.repository.js';
import prisma from '../src/utils/prisma.js';

import { OrderStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  // ----------------------
  // 1. 기본 리소스
  // ----------------------
  await prisma.image.upsert({
    where: { id: config.resource.defaultImageId },
    update: {}, // 이미 있으면 변경하지 않음
    create: {
      // 없으면 새로 생성
      id: config.resource.defaultImageId,
      key: config.resource.defaultImageKey,
      url: config.resource.defaultImageUrl,
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

  const [seller1, seller2, buyer1, buyer2, buyer3] = await Promise.all([
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
      where: { email: 'seller2@test.com' },
      update: {},
      create: {
        email: 'seller2@test.com',
        name: '셀러2',
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
    prisma.user.upsert({
      where: { email: 'buyer2@test.com' },
      update: {},
      create: {
        email: 'buyer2@test.com',
        name: '바이어2',
        password: hashedPassword,
        lastLoginAt: new Date(),
        type: UserRole.BUYER,
        gradeId: 'grade_green',
      },
    }),
    prisma.user.upsert({
      where: { email: 'buyer3@test.com' },
      update: {},
      create: {
        email: 'buyer3@test.com',
        name: '바이어3',
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
      { name: 'top' },
      { name: 'bottom' },
      { name: 'outer' },
      { name: 'dress' },
      { name: 'skirt' },
      { name: 'shoes' },
      { name: 'acc' },
    ],
    skipDuplicates: true,
  });

  // ----------------------
  // 5. 사이즈
  // ----------------------
  await prisma.size.createMany({
    data: [
      { id: 1, name: 'XS', sizeDetail: { ko: '엑스스몰', en: 'X-Small' } },
      { id: 2, name: 'S', sizeDetail: { ko: '스몰', en: 'Small' } },
      { id: 3, name: 'M', sizeDetail: { ko: '미디움', en: 'Medium' } },
      { id: 4, name: 'L', sizeDetail: { ko: '라지', en: 'Large' } },
      { id: 5, name: 'XL', sizeDetail: { ko: '엑스라지', en: 'X-Large' } },
      { id: 6, name: 'Free', sizeDetail: { ko: '프리사이즈', en: 'Free' } },
    ],
    skipDuplicates: true,
  });

  // ----------------------
  // 6. 스토어
  // ----------------------
  const [seller1Store, seller2Store] = await Promise.all([
    prisma.store.upsert({
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
    }),
    prisma.store.upsert({
      where: { userId: seller2.id },
      update: {},
      create: {
        name: '셀러2 스토어',
        content: '셀러2 스토어 소개',
        address: '서울시 서초구',
        detailAddress: '강남대로 2',
        phoneNumber: '010-2222-2222',
        userId: seller2.id,
      },
    }),
  ]);

  // ----------------------
  // 7. 관심 스토어
  // ----------------------
  await prisma.favoriteStore.upsert({
    where: { userId_storeId: { userId: buyer1.id, storeId: seller1Store.id } },
    update: {},
    create: { userId: buyer1.id, storeId: seller1Store.id },
  });

  // ----------------------
  // 8. 상품
  // ----------------------
  const categories = {
    top: await prisma.category.findFirst({ where: { name: 'top' } }),
    bottom: await prisma.category.findFirst({ where: { name: 'bottom' } }),
    outer: await prisma.category.findFirst({ where: { name: 'outer' } }),
    dress: await prisma.category.findFirst({ where: { name: 'dress' } }),
  };

  const [product1, product2, product3, product4, product5] = await Promise.all([
    prisma.product.upsert({
      where: { id: 'testProductId' },
      update: {},
      create: {
        id: 'testProductId',
        storeId: seller1Store.id,
        categoryId: categories.outer!.id,
        name: '[테스트] 자켓',
        price: 50000,
        content: '이 상품에 문의를 남겨서 판매자 알림을 테스트해보세요.',
        isSoldOut: false,
        salesCount: 0,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product2' },
      update: {},
      create: {
        id: 'product2',
        storeId: seller1Store.id,
        categoryId: categories.top!.id,
        name: '베이직 티셔츠',
        price: 25000,
        content: '데일리로 입기 좋은 베이직 티셔츠입니다.',
        isSoldOut: false,
        salesCount: 15,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product3' },
      update: {},
      create: {
        id: 'product3',
        storeId: seller1Store.id,
        categoryId: categories.bottom!.id,
        name: '슬림 진',
        price: 45000,
        content: '슬림한 핏의 청바지입니다.',
        isSoldOut: false,
        salesCount: 8,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product4' },
      update: {},
      create: {
        id: 'product4',
        storeId: seller2Store.id,
        categoryId: categories.dress!.id,
        name: '원피스',
        price: 65000,
        content: '편한 원피스입니다.',
        isSoldOut: false,
        salesCount: 20,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product5' },
      update: {},
      create: {
        id: 'product5',
        storeId: seller2Store.id,
        categoryId: categories.top!.id,
        name: '니트',
        price: 35000,
        content: '따뜻한 겨울 니트입니다.',
        isSoldOut: false,
        salesCount: 12,
        reviewsCount: 0,
        reviewsRating: 0,
      },
    }),
  ]);

  // ----------------------
  // 9. 재고 추가
  // ----------------------
  await Promise.all([
    // product1 재고
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product1.id, sizeId: 2 } },
      update: { quantity: 10 },
      create: { productId: product1.id, sizeId: 2, quantity: 10 },
    }),
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product1.id, sizeId: 3 } },
      update: { quantity: 10 },
      create: { productId: product1.id, sizeId: 3, quantity: 10 },
    }),
    // product2 재고
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product2.id, sizeId: 1 } },
      update: { quantity: 10 },
      create: { productId: product2.id, sizeId: 1, quantity: 10 },
    }),
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product2.id, sizeId: 2 } },
      update: { quantity: 10 },
      create: { productId: product2.id, sizeId: 2, quantity: 10 },
    }),
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product2.id, sizeId: 3 } },
      update: { quantity: 10 },
      create: { productId: product2.id, sizeId: 3, quantity: 10 },
    }),
    // product3 재고
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product3.id, sizeId: 2 } },
      update: { quantity: 10 },
      create: { productId: product3.id, sizeId: 2, quantity: 10 },
    }),
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product3.id, sizeId: 3 } },
      update: { quantity: 10 },
      create: { productId: product3.id, sizeId: 3, quantity: 10 },
    }),
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product3.id, sizeId: 4 } },
      update: { quantity: 10 },
      create: { productId: product3.id, sizeId: 4, quantity: 10 },
    }),
    // product4 재고
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product4.id, sizeId: 6 } },
      update: { quantity: 10 },
      create: { productId: product4.id, sizeId: 6, quantity: 10 },
    }),
    // product5 재고
    prisma.productStock.upsert({
      where: { productId_sizeId: { productId: product5.id, sizeId: 6 } },
      update: { quantity: 10 },
      create: { productId: product5.id, sizeId: 6, quantity: 10 },
    }),
  ]);

  // ----------------------
  // 10. 장바구니 생성
  // ----------------------
  const [cart1, cart2, cart3] = await Promise.all([
    prisma.cart.upsert({
      where: { userId: buyer1.id },
      update: {},
      create: { userId: buyer1.id },
    }),
    prisma.cart.upsert({
      where: { userId: buyer2.id },
      update: {},
      create: { userId: buyer2.id },
    }),
    prisma.cart.upsert({
      where: { userId: buyer3.id },
      update: {},
      create: { userId: buyer3.id },
    }),
  ]);

  // ----------------------
  // 11. 장바구니 아이템 생성
  // ----------------------
  await Promise.all([
    // buyer1 장바구니: product1 M사이즈 2개, product3 L사이즈 1개
    prisma.cartItem.upsert({
      where: { cartId_productId_sizeId: { cartId: cart1.id, productId: product1.id, sizeId: 3 } },
      update: { quantity: 2 },
      create: { cartId: cart1.id, productId: product1.id, sizeId: 3, quantity: 2 },
    }),
    prisma.cartItem.upsert({
      where: { cartId_productId_sizeId: { cartId: cart1.id, productId: product3.id, sizeId: 4 } },
      update: { quantity: 1 },
      create: { cartId: cart1.id, productId: product3.id, sizeId: 4, quantity: 1 },
    }),
    // buyer2 장바구니: product4 Free사이즈 1개
    prisma.cartItem.upsert({
      where: { cartId_productId_sizeId: { cartId: cart2.id, productId: product4.id, sizeId: 6 } },
      update: { quantity: 1 },
      create: { cartId: cart2.id, productId: product4.id, sizeId: 6, quantity: 1 },
    }),
    // buyer3 장바구니: product2 S사이즈 3개, product5 Free사이즈 2개
    prisma.cartItem.upsert({
      where: { cartId_productId_sizeId: { cartId: cart3.id, productId: product2.id, sizeId: 2 } },
      update: { quantity: 3 },
      create: { cartId: cart3.id, productId: product2.id, sizeId: 2, quantity: 3 },
    }),
    prisma.cartItem.upsert({
      where: { cartId_productId_sizeId: { cartId: cart3.id, productId: product5.id, sizeId: 6 } },
      update: { quantity: 2 },
      create: { cartId: cart3.id, productId: product5.id, sizeId: 6, quantity: 2 },
    }),
  ]);

  // ----------------------
  // 12. 주문 생성
  // ----------------------
  const [order1, order2, order3] = await Promise.all([
    // buyer1의 주문 (product2 구매)
    prisma.order.upsert({
      where: { id: 'order1' },
      update: {},
      create: {
        id: 'order1',
        userId: buyer1.id,
        name: '바이어1',
        phoneNumber: '010-1111-1111',
        address: '서울시 강남구 테헤란로 1, 101동 101호',
        email: buyer1.email,
        subtotal: 25000,
        usePoint: 0,
        status: OrderStatus.Delivered,
      },
    }),
    // buyer2의 주문 (product3, product4 구매)
    prisma.order.upsert({
      where: { id: 'order2' },
      update: {},
      create: {
        id: 'order2',
        userId: buyer2.id,
        name: '바이어2',
        phoneNumber: '010-2222-2222',
        address: '서울시 서초구 강남대로 2, 201동 201호',
        email: buyer2.email,
        subtotal: 110000,
        usePoint: 0,
        status: OrderStatus.Delivered,
      },
    }),
    // buyer3의 주문 (product4, product5 구매)
    prisma.order.upsert({
      where: { id: 'order3' },
      update: {},
      create: {
        id: 'order3',
        userId: buyer3.id,
        name: '바이어3',
        phoneNumber: '010-3333-3333',
        address: '서울시 송파구 올림픽로 3, 301동 301호',
        email: buyer3.email,
        subtotal: 100000,
        usePoint: 0,
        status: OrderStatus.Delivered,
      },
    }),
  ]);

  // ----------------------
  // 13. 주문 아이템 생성
  // ----------------------
  const [orderItem1, orderItem2, orderItem3, orderItem4, orderItem5] = await Promise.all([
    // order1 - product2
    prisma.orderItem.upsert({
      where: { id: 'orderItem1' },
      update: {},
      create: {
        id: 'orderItem1',
        orderId: order1.id,
        productId: product2.id,
        productName: product2.name,
        quantity: 1,
        price: 25000,
        sizeId: 2,
        isReviewed: false,
      },
    }),
    // order2 - product3
    prisma.orderItem.upsert({
      where: { id: 'orderItem2' },
      update: {},
      create: {
        id: 'orderItem2',
        orderId: order2.id,
        productId: product3.id,
        productName: product3.name,
        quantity: 1,
        price: 45000,
        sizeId: 3,
        isReviewed: false,
      },
    }),
    // order2 - product4
    prisma.orderItem.upsert({
      where: { id: 'orderItem3' },
      update: {},
      create: {
        id: 'orderItem3',
        orderId: order2.id,
        productId: product4.id,
        productName: product4.name,
        quantity: 1,
        price: 65000,
        sizeId: 6,
        isReviewed: false,
      },
    }),
    // order3 - product4
    prisma.orderItem.upsert({
      where: { id: 'orderItem4' },
      update: {},
      create: {
        id: 'orderItem4',
        orderId: order3.id,
        productId: product4.id,
        productName: product4.name,
        quantity: 1,
        price: 65000,
        sizeId: 6,
        isReviewed: false,
      },
    }),
    // order3 - product5
    prisma.orderItem.upsert({
      where: { id: 'orderItem5' },
      update: {},
      create: {
        id: 'orderItem5',
        orderId: order3.id,
        productId: product5.id,
        productName: product5.name,
        quantity: 1,
        price: 35000,
        sizeId: 6,
        isReviewed: false,
      },
    }),
  ]);

  // ----------------------
  // 14. 리뷰 생성
  // ----------------------
  await Promise.all([
    // product2에 대한 리뷰 (buyer1)
    prisma.review.upsert({
      where: { id: 'review1' },
      update: {},
      create: {
        id: 'review1',
        userId: buyer1.id,
        productId: product2.id,
        orderItemId: orderItem1.id,
        rating: 5,
        content: '정말 좋아요! 품질도 좋고 배송도 빨라요.',
      },
    }),
    // product3에 대한 리뷰 (buyer2)
    prisma.review.upsert({
      where: { id: 'review2' },
      update: {},
      create: {
        id: 'review2',
        userId: buyer2.id,
        productId: product3.id,
        orderItemId: orderItem2.id,
        rating: 4,
        content: '핏이 딱 맞아요. 만족합니다.',
      },
    }),
    // product4에 대한 리뷰 (buyer2)
    prisma.review.upsert({
      where: { id: 'review3' },
      update: {},
      create: {
        id: 'review3',
        userId: buyer2.id,
        productId: product4.id,
        orderItemId: orderItem3.id,
        rating: 5,
        content: '편하고 평소에 입기 좋습니다',
      },
    }),
    // product4에 대한 리뷰 (buyer3)
    prisma.review.upsert({
      where: { id: 'review4' },
      update: {},
      create: {
        id: 'review4',
        userId: buyer3.id,
        productId: product4.id,
        orderItemId: orderItem4.id,
        rating: 5,
        content: '원피스 정말 예쁘고 품질도 좋아요!',
      },
    }),
    // product5에 대한 리뷰 (buyer3)
    prisma.review.upsert({
      where: { id: 'review5' },
      update: {},
      create: {
        id: 'review5',
        userId: buyer3.id,
        productId: product5.id,
        orderItemId: orderItem5.id,
        rating: 3,
        content: '따뜻하긴 한데 사진보다 색이 좀 다른 것 같아요.',
      },
    }),
  ]);

  // ----------------------
  // 15. 리뷰 작성 완료 표시
  // ----------------------
  await Promise.all([
    prisma.orderItem.update({ where: { id: orderItem1.id }, data: { isReviewed: true } }),
    prisma.orderItem.update({ where: { id: orderItem2.id }, data: { isReviewed: true } }),
    prisma.orderItem.update({ where: { id: orderItem3.id }, data: { isReviewed: true } }),
    prisma.orderItem.update({ where: { id: orderItem4.id }, data: { isReviewed: true } }),
    prisma.orderItem.update({ where: { id: orderItem5.id }, data: { isReviewed: true } }),
  ]);

  // ----------------------
  // 16. 상품별 리뷰 통계 업데이트
  // ----------------------
  await Promise.all([
    productRepository.updateProductReviewStats(product2.id),
    productRepository.updateProductReviewStats(product3.id),
    productRepository.updateProductReviewStats(product4.id),
    productRepository.updateProductReviewStats(product5.id),
  ]);

  console.log('✅ 시드 데이터 생성 완료!');
  console.log('📊 생성된 데이터:');
  console.log('   - 유저: 5명 (셀러 2명, 바이어 3명)');
  console.log('   - 스토어: 2개');
  console.log('   - 상품: 5개');
  console.log('   - 장바구니: 3개 (바이어별 1개)');
  console.log('   - 장바구니 아이템: 5개');
  console.log('   - 주문: 3개');
  console.log('   - 주문 아이템: 5개');
  console.log('   - 리뷰: 5개');
  console.log('   - product2 (베이직 티셔츠): 리뷰 1개, 평점 5.0');
  console.log('   - product3 (슬림 진): 리뷰 1개, 평점 4.0');
  console.log('   - product4 (원피스): 리뷰 2개, 평점 5.0');
  console.log('   - product5 (니트): 리뷰 1개, 평점 3.0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
