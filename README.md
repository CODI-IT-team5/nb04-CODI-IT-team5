# 🛍️ CODI-IT

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=slice&color=1a1a1a&height=250&section=header&text=CODI-IT&fontSize=80&fontColor=ffffff&animation=fadeIn&desc=Fashion%20E-commerce&descSize=25&descAlignY=65"/>
</div>

<div align="center">
  <br/>
  <a href="https://codi-it-front.vercel.app">
    <img src="https://img.shields.io/badge/Store-Visit_CODI--IT-black?style=for-the-badge&logo=vercel&logoColor=white">
  </a>
  <a href="https://www.notion.so/Team5-Codi-it-2a9fb7562ded80018c92f1fadca49d17?source=copy_link">
  <img src="https://img.shields.io/badge/Team_Docs-Notion-000000?style=for-the-badge&logo=notion&logoColor=white">
</a>
  <br/><br/>
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
  <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white">
  <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <br/>
  <img src="https://img.shields.io/badge/aws_ec2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">
  <img src="https://img.shields.io/badge/github_actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white">
</div>

---

**CODI-IT**은 판매자와 구매자를 연결하는 고도화된 패션 이커머스 플랫폼입니다.
Layered Architecture를 기반으로 확장성 있는 백엔드 시스템을 구축하였으며, 실시간 알림, 
등급별 포인트 시스템, 판매자 대시보드 등 복잡한 비즈니스 로직을 안정적으로 처리합니다.

## 📚 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택](#-기술-스택)
3. [데이터베이스 모델링 (ERD)](#-데이터베이스-모델링-erd)
4. [아키텍처 및 디자인 패턴](#-아키텍처-및-디자인-패턴)
5. [핵심 구현 기술 (Technical Highlights)](#-핵심-구현-기술-technical-highlights)
6. [주요 기능](#-주요-기능)
7. [API 문서 및 테스트 계정](#-api-문서-및-테스트-계정)
8. [설치 및 실행 방법](#-설치-및-실행-방법)
9. [테스트](#-테스트)
10. [배포 파이프라인](#-배포-파이프라인)

---

## 📝 프로젝트 개요

- **주제**: B2C 패션 이커머스 플랫폼
- **목표**: 대용량 트래픽을 고려한 안정적인 서버 구축 및 사용자 경험(UX) 중심의 기능 구현
- **배포 주소**: `http://3.34.104.78` (API 서버)
- **프론트엔드**: [데모 링크](https://codi-it-front.vercel.app)

---

## 🛠 기술 스택

| 분류 | 기술 |
| --- | --- |
| **Language** | TypeScript |
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Caching** | **LRU Cache** (In-memory) |
| **Scheduling** | **Node-cron** |
| **Logging** | **Pino** (Structured Logging) |
| **Validation** | Zod |
| **Documentation** | Swagger (OpenAPI 3.0) |
| **Testing** | Jest, Supertest, Artillery (부하 테스트) |
| **Cloud & DevOps** | AWS (EC2, RDS, S3), Docker, Nginx, PM2, GitHub Actions |
| **Security** | Helmet, CORS, Rate Limit, Bcrypt, JWT |

---

## 📊 데이터베이스 모델링 (ERD)

```mermaid
erDiagram
    User ||--o| Store : "owns (1:1)"
    User ||--o{ Order : "places"
    User ||--o{ Review : "writes"
    User ||--o{ Inquiry : "asks"
    User ||--o{ Notification : "receives"
    User ||--|| Cart : "has (1:1)"
    User ||--o{ PointHistory : "has"
    User }|--|| Grade : "belongs to"

    Store ||--o{ Product : "sells"
    Store }|--|| User : "owned by"

    Product }|--|| Store : "belongs to"
    Product }|--o| Category : "categorized in"
    Product ||--o{ ProductStock : "has stock"
    Product ||--o{ Review : "has"
    Product ||--o{ Inquiry : "has"
    Product ||--o{ OrderItem : "included in"
    Product ||--o{ CartItem : "added to"
    Product ||--o{ ProductDiscount : "has discount"

    Order }|--|| User : "ordered by"
    Order ||--o{ OrderItem : "contains"
    Order ||--o| Payment : "paid with"
    Order ||--o{ PointHistory : "generates"

    OrderItem }|--|| Order : "part of"
    OrderItem }|--|| Product : "refers to"
    OrderItem }|--|| Size : "has size"
    OrderItem ||--o| Review : "reviewed in"

    Cart ||--|| User : "belongs to"
    Cart ||--o{ CartItem : "contains"

    CartItem }|--|| Cart : "in"
    CartItem }|--|| Product : "is"
    CartItem }|--|| Size : "has size"

    Review }|--|| User : "written by"
    Review }|--|| Product : "about"
    Review |o--|| OrderItem : "verified purchase"

    Inquiry }|--|| User : "asked by"
    Inquiry }|--|| Product : "about"
    Inquiry ||--o| InquiryReply : "replied with"

    InquiryReply |o--|| Inquiry : "answers"
    InquiryReply }|--|| User : "answered by"

    ProductStock }|--|| Product : "of"
    ProductStock }|--|| Size : "size"

    Notification }|--|| User : "to"
```

주요 모델 간의 관계는 다음과 같습니다.

- **User**: 구매자/판매자 정보, 등급, 포인트.
- **Store**: 판매자 1명당 1개의 스토어 소유.
- **Product**: 스토어에 속하며, 다수의 사이즈 옵션(`ProductStock`) 보유.
- **Order**: `OrderItem`을 통해 상품과 N:M 관계 형성. `Payment`와 1:1 관계.
- **Review/Inquiry**: 상품에 대한 커뮤니티 기능.

---

## 🏗 아키텍처 및 디자인 패턴

본 프로젝트는 유지보수성과 책임 분리를 위해 **Layered Architecture**를 채택했습니다.

```bash
Request -> Router -> Middleware -> Controller -> DTO (Zod) -> Service -> Repository -> Database
                                        ^           |
                                        |           v
                                    Serializer <- Response
```

### 디렉토리 구조
```bash
src/
├── app.ts                  # App 진입점 및 미들웨어 설정
├── config/                 # 환경변수 설정
├── controllers/            # 요청 처리 및 응답 반환
├── services/               # 비즈니스 로직 수행
├── repositories/           # DB 데이터 접근 계층 (Prisma)
├── dtos/                   # 데이터 전송 객체 및 유효성 검사 (Zod)
├── routes/                 # API 라우팅 정의
├── serializes/             # 응답 데이터 가공 및 직렬화
├── middlewares/            # 인증, 로깅, 에러 핸들링
├── swagger/                # API 문서 명세 (OpenAPI)
├── utils/                  # 공통 유틸리티 (Prisma 확장, Logger, Cache, Cron 등)
└── __tests__/              # Unit, Integration, E2E 테스트
```

---

## 💡 핵심 구현 기술 (Technical Highlights)

단순한 기능 구현을 넘어, 성능 최적화와 시스템 안정성을 고려한 고급 기술들을 적용했습니다.

### 1. 고성능 캐싱 전략 (LRU Cache)
- **Problem**: 상품 상세 조회나 대시보드 통계와 같은 Read-heavy 작업 시 DB 부하 증가.
- **Solution**: `lru-cache`를 사용하여 메모리 기반 캐싱 레이어 구현.
- **Details**:
    - `CacheManager` 클래스를 통해 캐시 인스턴스(상품, 카테고리, 대시보드 등)를 중앙 관리.
    - 각 데이터 특성에 맞는 TTL(Time-To-Live) 및 Max Size 설정 (예: 대시보드 5분, 상품 상세 30분).
    - 데이터 수정 시 관련 캐시 키를 즉시 무효화(Invalidate)하여 데이터 일관성 보장.

### 2. 안정적인 배치 처리 (Cron Jobs)
- **Problem**: `Soft Delete`로 인해 쌓이는 삭제된 데이터의 영구 삭제 및 정리 필요.
- **Solution**: `node-cron`을 활용한 자동화된 스케줄링 시스템 구축.
- **Details**:
    - **Retention Policy**: 데이터 유형별(세금 관련 5년, 사용자 데이터 30일 등) 보관 정책 수립.
    - **Batch Processing**: 대량의 데이터 삭제 시 DB 락(Lock) 유발을 방지하기 위해 청크(Chunk) 단위로 나누어 삭제하는 배치 로직 구현.

### 3. 데이터 무결성을 위한 Soft Delete
- **Problem**: 실수로 인한 데이터 삭제 방지 및 법적 증거 보존 필요.
- **Solution**: Prisma Client Extension을 활용하여 전역적인 Soft Delete 미들웨어 구현.
- **Details**:
    - `delete` 쿼리를 `update({ deletedAt: new Date() })`로 자동 변환.
    - `find` 쿼리 시 `deletedAt: null` 조건을 자동으로 주입하여 삭제된 데이터 노출 방지.

### 4. 구조화된 로깅 (Structured Logging)
- **Problem**: 텍스트 기반 로그의 가독성 저하 및 검색 어려움.
- **Solution**: `pino` 라이브러리를 도입하여 JSON 기반의 구조화된 로깅 구현.
- **Details**:
    - `Multi-target Transport`: 개발 환경에서는 가독성 높은 `pino-pretty`, 운영 환경에서는 파일 시스템으로 로그 전송.
    - HTTP 요청 메타데이터(IP, Method, Path)를 자동으로 로깅 컨텍스트에 포함.

### 5. API 보안 및 안정성 (Rate Limiting)
- **Problem**: DDoS 공격 및 무분별한 API 요청으로 인한 서버 자원 고갈 위험.
- **Solution**: `express-rate-limit` 미들웨어 적용.
- **Details**:
    - IP 기반의 요청 횟수 제한을 통해 비정상적인 트래픽 차단.

---

## ✨ 주요 기능

### 1. 인증 & 인가 (Auth)
- **JWT 기반 인증**: Access/Refresh Token 전략 사용.
- **Role-Based Access Control (RBAC)**: 미들웨어를 통한 판매자(`SELLER`)와 구매자(`BUYER`) 권한 분리.

### 2. 상품 관리 (Product)
- **옵션 관리**: 상품별 사이즈 및 재고 수량 관리 트랜잭션 처리.
- **검색 및 필터**: 카테고리, 가격 범위, 사이즈, 정렬(판매순, 리뷰순 등) 기능을 동적 쿼리로 구현.
- **할인 시스템**: 기간 한정 할인 로직 적용.

### 3. 주문 및 결제 (Order)
- **트랜잭션 보장**: 재고 차감, 포인트 사용/적립, 주문 생성, 장바구니 삭제가 하나의 트랜잭션으로 원자성 보장.
- **포인트 시스템**: 회원 등급(Grade)에 따른 차등 적립률 적용.

### 4. 실시간 알림 (Notification)
- **SSE (Server-Sent Events)**: 
    - 구매자: 장바구니/주문 상품 품절 시, 문의 답변 등록 시 알림.
    - 판매자: 상품 품절 임박 시, 신규 문의 등록 시 알림.

### 5. 판매자 대시보드 (Dashboard)
- 기간별 매출, 판매량, 베스트 셀러 상품 TOP 5 등 통계 데이터 제공.
- 데이터 집계 쿼리 최적화 및 캐싱 적용으로 응답 속도 개선.

### 6. 이미지 처리 (S3)
- AWS S3 및 `multer-s3`를 이용한 이미지 업로드 및 관리.

---

## 📘 API 문서 및 테스트 계정

서버 실행 후 아래 주소에서 Swagger UI를 통해 API 명세를 확인할 수 있습니다.

- **URL**: `http://localhost:3000/api-docs`
- **프로덕션**: `http://3.34.104.78/api-docs`

### 🔑 테스트 계정 정보

서비스의 주요 기능을 테스트해 보실 수 있도록 미리 생성된 계정입니다. (비밀번호 공통: `test1234`)

| 구분 | 이메일 | 역할 및 특징 |
| :--- | :--- | :--- |
| **판매자** | `seller1@test.com` | 상품 등록 및 주문 관리 가능 (셀러1 스토어) |
| **판매자** | `seller2@test.com` | 상품 등록 및 주문 관리 가능 (셀러2 스토어) |
| **구매자** | `buyer1@test.com` | 주문 내역 및 장바구니 데이터 포함 |
| **구매자** | `buyer2@test.com` | 주문 내역 및 리뷰 데이터 포함 |

---

## 🚀 설치 및 실행 방법

### 1. 환경 변수 설정 (.env)
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요.
```env
DATABASE_URL="postgresql://user:password@localhost:5432/codiit_db"
PORT=3000
NODE_ENV="development"

# JWT
ACCESS_TOKEN_SECRET="your_access_secret"
REFRESH_TOKEN_SECRET="your_refresh_secret"

# AWS
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="ap-northeast-2"
AWS_BUCKET_NAME="your_bucket_name"
```

### 2. 로컬 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 생성 및 마이그레이션
npx prisma generate
npx prisma db push
npx prisma db seed # 초기 데이터 시딩

# 개발 모드 실행
npm run dev
```

### 3. Docker 실행
```bash
docker-compose up --build -d
```

---

## 🧪 테스트

Jest를 사용하여 유닛 테스트, 통합 테스트, E2E 테스트를 수행합니다.

```bash
# 전체 테스트 실행
npm test

# 유닛 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e
```

---

## 🚢 배포 파이프라인

GitHub Actions를 통해 CI/CD 파이프라인이 구축되어 있습니다.

1.  **CI (Continuous Integration)**: 
    - PR 생성 및 Push 시 동작.
    - 코드 린팅 (`npm run lint`), 빌드 검증, 유닛 테스트 수행.
2.  **CD (Continuous Deployment)**:
    - Main 브랜치 Merge 시 동작.
    - Docker Image 빌드 및 ECR 푸시.
    - AWS EC2에 자동 배포 (Self-hosted runner 또는 SSH).
    - PM2를 이용한 무중단 서비스 운영.

---
