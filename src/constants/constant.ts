// TODO: 이름 컨벤션 통일하기
export const STATUS_CODE = {
  OK: 200, // 요청 성공
  CREATED: 201, // 요청 성공으로 새로운 리소스 생성
  NO_CONTENT: 204, // 보내줄 수 있는 콘텐츠 없음
  BAD_REQUEST: 400, // 잘못된 요청
  UNAUTHORIZED: 401, // 인증 안 됨
  FORBIDDEN: 403, // 권리 없음
  NOT_FOUND: 404, // 리소스 찾을 수 없음
  CONFLICT: 409, // 요청이 서버 상태와 충돌
  TOO_MANY_REQUESTS: 429, // 너무 많은 요청 보냄
  INTERNAL_SERVER_ERROR: 500, // 서버 에러
};

export const MESSAGE = {
  userAuthenticated: '사용자가 성공적으로 인증되었습니다',
  emailAlready: '이미 존재하는 유저입니다',
  logoutSuccess: '성공적으로 로그아웃되었습니다',
  userDeleted: '회원탈퇴를 성공했습니다',
  invalidPassword: '현재 비밀번호가 올바르지 않습니다',

  uploadSuccess: '업로드 성공',

  refreshTokenNotFound: '리프레시 토큰을 찾을 수 없습니다',
  userNotFound: '유저를 찾을 수 없습니다',
  notFound: '요청한 리소스를 찾을 수 없습니다',

  expiredToken: '토큰이 만료되었습니다',
  invalidToken: '유효하지 않은 토큰입니다',
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다',
  badRequest: '잘못된 요청입니다',

  unauthorized: '로그인이 필요합니다',
  forbidden: '권한이 없습니다',

  orderItemsEmpty: '주문할 상품이 없습니다.',
  insufficientStock: (sizeId: number | string, availableQuantity: number) =>
    `사이즈 ${sizeId}의 재고가 부족합니다. 원재 수량: ${availableQuantity}`,
  insufficientPoints: '보유 포인트를 초과하여 사용할 수 없습니다.',

  sizeNotFound: '사이즈가 존재하지 않습니다',
  cartCreationFailed: '장바구니 생성에 실패했습니다',
  cartNotFound: '장바구니를 찾을 수 없습니다',
  cartItemNotFound: '장바구니에 아이템이 없습니다',

  tooManyRequests: '요청이 너무 많습니다. 잠시 후 시도해주세요',
  serverError: '문제가 발생했습니다. 나중에 다시 시도하세요',

  orderNotFound: '주문을 찾을 수 없습니다.',
  orderCancellationFailed: '주문 취소에 실패했습니다.',

  productCreationFailed: '상품 생성 후 조회에 실패했습니다.',
  productNotFound: '상품을 찾을 수 없습니다.',
  productUpdateFailed: '상품 업데이트 후 조회에 실패했습니다.',
  storeNotFound: '스토어가 없습니다. 판매자만 상품을 등록할 수 있습니다.',
  categoryNotFound: '카테고리를 찾을 수 없습니다.',
  productOwnershipRequired: '본인의 상품만 수정/삭제할 수 있습니다.',
};
