import type { Category, Product, ProductDiscount, ProductStock, Size, Store } from '@prisma/client';

import type { CreateProductDto, UpdateProductDto } from '../dtos/product.dto.js';

// 상품 목록용 상품 타입 (productDiscounts 포함)
export interface ProductWithStore extends Product {
  store: Store;
  productDiscounts: ProductDiscount[];
}

// 레포지토리에서 반환하는 상품 타입 (변환 전)
export interface ProductWithRelations extends Product {
  store: Store;
  category: Category | null;
  stocks: (ProductStock & {
    size: Size;
  })[];
  productDiscounts: ProductDiscount[];
  reviews: {
    rating: number;
  }[];
  inquiries: {
    id: string;
    title: string;
    content: string;
    status: string;
    isSecret: boolean;
    createdAt: Date;
    updatedAt: Date;
    reply: {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      user: {
        id: string;
        name: string;
      };
    } | null;
  }[];
}

// 서비스에서 변환된 상품 타입 (시리얼라이즈 전)
export interface TransformedProduct extends Omit<ProductWithRelations, 'reviews'> {
  reviews: {
    rate1Length: number;
    rate2Length: number;
    rate3Length: number;
    rate4Length: number;
    rate5Length: number;
    sumScore: number;
  }[];
}

// 상품 목록 아이템 (목록 조회용 간소화 버전)
export interface ProductListItem {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  discountRate: number | null;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  reviewsCount: number;
  reviewsRating: number;
  createdAt: Date;
  updatedAt: Date;
  sales: number;
  isSoldOut: boolean;
}

// 상품 상세 정보용 문의 타입 (ProductWithRelations의 inquiries 항목과 동일)
export type Inquiry = ProductWithRelations['inquiries'][number];

// 재고 아이템 (생성/수정용)
export interface StockInput {
  sizeId: string;
  quantity: number;
}

// 상품 생성 입력 데이터
export interface CreateProductData {
  name: string;
  price: number;
  content?: string;
  image?: string;
  categoryName: string;
  stocks: StockInput[];
  discountRate?: number;
  discountStartTime?: string;
  discountEndTime?: string;
}

// 상품 수정 입력 데이터 (생성 데이터를 모두 optional로 + isSoldOut 추가)
export interface UpdateProductData extends Partial<CreateProductData> {
  isSoldOut?: boolean;
}

// 상품 목록 조회 필터
export interface ProductListFilters {
  page: number;
  pageSize: number;
  search?: string | undefined;
  sort?: 'mostReviewed' | 'recent' | 'lowPrice' | 'highPrice' | 'highRating' | 'salesRanking' | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  size?: string | undefined;
  favoriteStore?: string | undefined;
  categoryName?: string | undefined;
}

// 상품 목록 응답
export interface ProductListResponse {
  list: ProductListItem[];
  totalCount: number;
}

export interface ProductUpdateServiceInput extends UpdateProductDto {
  userId: string;
  productId: string;
}

export interface ProductCreateServiceInput {
  userId: string;
  data: CreateProductDto;
}

export interface ProductGetListServiceInput {
  filters: ProductListFilters;
  userId?: string | undefined;
}

export interface ProductDeleteServiceInput {
  userId: string;
  productId: string;
}

export interface ProductOwnershipValidationInput {
  productId: string;
  userId: string;
}
