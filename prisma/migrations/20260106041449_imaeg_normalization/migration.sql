/*
  Warnings:

  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "image",
ADD COLUMN     "imageId" TEXT NOT NULL DEFAULT 'default-image';

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "image",
ADD COLUMN     "imageId" TEXT NOT NULL DEFAULT 'default-image';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "imageId" TEXT NOT NULL DEFAULT 'default-image';

-- CreateIndex
CREATE INDEX "Product_imageId_idx" ON "Product"("imageId");

-- CreateIndex
CREATE INDEX "Store_imageId_idx" ON "Store"("imageId");

-- CreateIndex
CREATE INDEX "User_imageId_idx" ON "User"("imageId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
