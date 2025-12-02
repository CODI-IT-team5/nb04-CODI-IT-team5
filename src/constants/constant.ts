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

export const SEND_BIRD_CODE = {
  ResourceNotFound: 400201, // 요청의 resourceId 매개 변수로 식별된 리소스를 찾을 수 없습니다.
  InternalError: 500901, // 서버에서 요청을 처리하려고 하는 동안 예기치 않은 예외가 발생합니다. 요청을 다시 시도하십시오.
  InvalidValue: 400111, // 요청이 잘못된 값을 지정합니다.
  InvalidApiToken: 400401, // 요청에 제공된 API 토큰은 유효하지 않은 값을 지정합니다.
};

export const MESSAGE = {
  userAuthenticated: '사용자가 성공적으로 인증되었습니다',
  userAready: '이미 존재하는 유저입니다',
  logoutSuccess: '성공적으로 로그아웃되었습니다',

  refreshTokenNotFound: '리프레시 토큰을 찾을 수 없습니다',
  userNotFound: '유저를 찾을 수 없습니다',
  notFound: '요청한 리소스를 찾을 수 없습니다',

  expiredToken: '토큰이 만료되었습니다',
  invalidToken: '유효하지 않은 토큰입니다',
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다',
  badRequest: '잘못된 요청입니다',

  unauthorized: '로그인이 필요합니다',
  forbidden: '권한이 없습니다',

  tooManyRequests: '요청이 너무 많습니다. 잠시 후 시도해주세요',
  serverError: '문제가 발생했습니다. 나중에 다시 시도하세요',
};
