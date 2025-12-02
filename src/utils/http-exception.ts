export class HttpException extends Error {
  code: number; // 샌드버드 에러 코드
  message: string;
  status: number;

  constructor({ status, code, message }: { status: number; code: number; message: string }) {
    super(message);
    this.status = status;
    this.code = code;
    this.message = message;
  }
}
