export const appConfig = {
  node_env: process.env['NODE_ENV'] || 'development', // 환경
  port: process.env['PORT'] || 3001, // 서버 실행 포트
  cors_origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000', // CORS 허용 주소
  app_name: process.env['APP_NAME'] || 'app_name', // 애플리케이션 이름
  logLevel: process.env['LOG_LEVEL'] || 'info', // 로그 레벨
  bcryptSaltRounds: Number(process.env['BCRYPT_SALT_ROUNDS']) || 10, // 암호화
};
