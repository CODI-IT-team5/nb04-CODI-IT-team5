import dotenv from 'dotenv';
import type { StringValue } from 'ms';

dotenv.config();

export const config = {
  app: {
    node_env: process.env['NODE_ENV'] || 'development', // 환경
    port: process.env['PORT'] || 3001, // 서버 실행 포트
    cors_origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    cors_credentials: process.env['CORS_CREDENTIALS'] === 'true',
    app_name: process.env['APP_NAME'] || 'app_name', // 애플리케이션 이름
    logLevel: process.env['LOG_LEVEL'] || 'info', // 로그 레벨
    bcryptSaltRounds: Number(process.env['BCRYPT_SALT_ROUNDS']) || 10, // 암호화
  },
  auth: {
    accessTokenSecretKey: process.env['ACCESS_TOKEN_SECRET_KEY'] ?? 'default-access-token-secret',
    refreshTokenSecretKey: process.env['REFRESH_TOKEN_SECRET_KEY'] ?? 'default-refresh-token-secret',
    accessTokenExpiresIn: (process.env['ACCESS_TOKEN_EXPIRES_IN'] as StringValue) ?? '1h',
    refreshTokenExpiresIn: (process.env['REFRESH_TOKEN_EXPIRES_IN'] as StringValue) ?? '7d',
  },
};
