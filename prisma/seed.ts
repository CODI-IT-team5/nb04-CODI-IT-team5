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

  await prisma.user.createMany({
    data: [
      {
        email: 'seller1@test.com',
        name: '셀러1',
        password: hashedPassword,
        lastLogin: new Date(),
        type: UserRole.SELLER,
        gradeId: 'grade_green',
      },
      {
        email: 'buyer1@test.com',
        name: '바이어1',
        password: hashedPassword,
        lastLogin: new Date(),
        type: UserRole.BUYER,
        gradeId: 'grade_green',
      },
    ],
    skipDuplicates: true,
  });

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
      { id: 'size_s', name: 'S', sizeDetail: { ko: '스몰', en: 'Small' } },
      { id: 'size_m', name: 'M', sizeDetail: { ko: '미디움', en: 'Medium' } },
      { id: 'size_l', name: 'L', sizeDetail: { ko: '라지', en: 'Large' } },
      { id: 'size_xl', name: 'XL', sizeDetail: { ko: '엑스라지', en: 'X-Large' } },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
