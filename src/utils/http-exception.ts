import { MESSAGE, STATUS_CODE } from '../constants/constant.js';

export class HttpException extends Error {
  status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.status = status;
  }

  // 유저를 찾을 수 없음
  static userNotFound() {
    return new HttpException({
      status: STATUS_CODE.NOT_FOUND,
      message: MESSAGE.userNotFound,
    });
  }

  // 리소스를 찾을 수 없음
  static notFound() {
    return new HttpException({
      status: STATUS_CODE.NOT_FOUND,
      message: MESSAGE.notFound,
    });
  }

  // 토큰 에러
  static tokenError() {
    return new HttpException({
      status: STATUS_CODE.UNAUTHORIZED,
      message: MESSAGE.invalidToken,
    });
  }

  // 이메일 또는 비밀번호 틀림
  static unauthorized(message?: string) {
    return new HttpException({
      status: STATUS_CODE.UNAUTHORIZED,
      message: message ?? MESSAGE.invalidCredentials,
    });
  }

  // 사용할 수 없는 이메일 입니다 (이미존재)
  static unavailableEmail() {
    return new HttpException({
      status: STATUS_CODE.CONFLICT,
      message: MESSAGE.emailAready,
    });
  }
}
