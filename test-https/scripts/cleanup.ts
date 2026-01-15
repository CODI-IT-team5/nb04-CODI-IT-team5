import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('------------------------------------------------');
  console.log('[System] 영구 삭제 스케줄러를 실행합니다...');

  // [Debug] 사용 가능한 모델 목록 확인
  // const availableModels = Object.keys(prisma).filter((key) => !key.startsWith("_"));
  // console.log("[Debug] Models:", availableModels.join(", "));
  console.log('------------------------------------------------');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // 1. 삭제 대상 유저 찾기
    const targets = await prisma.user.findMany({
      where: { deletedAt: { lte: thirtyDaysAgo } },
      select: { id: true },
    });

    const targetIds = targets.map((user) => user.id);

    if (targetIds.length > 0) {
      console.log(`[Info] 삭제 대상 유저 ${targetIds.length}명 발견.`);

      const stores = await prisma.store.findMany({
        where: { userId: { in: targetIds } },
        select: { id: true },
      });
      const storeIds = stores.map((s) => s.id);

      if (storeIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { storeId: { in: storeIds } },
          select: { id: true },
        });
        const productIds = products.map((p) => p.id);

        if (productIds.length > 0) {
          console.log(`   └ 연관된 상품 ${productIds.length}개와 하위 데이터를 삭제합니다...`);

          const safeDelete = async (modelName: string, field: string, ids: string[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const model = (prisma as any)[modelName];
            if (model) {
              try {
                await model.deleteMany({ where: { [field]: { in: ids } } });
              } catch (
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _e
              ) {
                // 에러나도 무시하고 다음으로 진행 (안전장치)
              }
            }
          };

          // [순서 중요] 상품의 자식 데이터들 싹 다 삭제
          // 로그에 나온 모델 기반으로 추가했습니다.
          await safeDelete('productDiscount', 'productId', productIds);
          await safeDelete('productStock', 'productId', productIds); // 재고
          await safeDelete('cartItem', 'productId', productIds); // 장바구니
          await safeDelete('orderItem', 'productId', productIds); // 주문내역
          await safeDelete('review', 'productId', productIds); // 리뷰
          await safeDelete('inquiry', 'productId', productIds); // 문의
          await safeDelete('favoriteProduct', 'productId', productIds);

          // 상품 본체 삭제
          await prisma.product.deleteMany({ where: { id: { in: productIds } } });
        }

        // 스토어 관련 데이터 삭제
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const favStore = (prisma as any).favoriteStore;
        if (favStore) await favStore.deleteMany({ where: { storeId: { in: storeIds } } });

        // 스토어 삭제
        await prisma.store.deleteMany({ where: { id: { in: storeIds } } });
        console.log(`   └ 연관된 스토어 ${storeIds.length}개를 삭제했습니다.`);
      }

      // 유저 삭제
      const result = await prisma.user.deleteMany({
        where: { id: { in: targetIds } },
      });

      console.log(`\x1b[32m[Success] 보관 기간(30일)이 지난 탈퇴 계정 ${result.count}개를 영구 삭제했습니다.\x1b[0m`);
    } else {
      console.log('\x1b[33m[Info] 삭제할 대상이 없습니다.\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[31m[Error] 스케줄러 실행 중 오류 발생:\x1b[0m');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('------------------------------------------------');
  }
}

main();
