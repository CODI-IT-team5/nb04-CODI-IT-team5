import dotenv from 'dotenv';
import fs from 'fs';
import type { StringValue } from 'ms';
import ms from 'ms';
import path from 'path';
import { URL } from 'url';

dotenv.config();

function getPortFromVscodeSettings(): string | undefined {
  try {
    const settingsPath = path.resolve(process.cwd(), '.vscode', 'settings.json');
    if (!fs.existsSync(settingsPath)) return undefined;
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const json = JSON.parse(raw);
    const base = json?.['rest-client.environmentVariables']?.$shared?.baseUrl;
    if (!base || typeof base !== 'string') return undefined;
    try {
      const u = new URL(base);
      return u.port || undefined;
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

const vscodePort = getPortFromVscodeSettings();

export const config = {
  app: {
    node_env: process.env['NODE_ENV'] || 'development', // 실행 환경 (dev/prod)
    port: process.env['PORT'] || vscodePort || 3001, // 서버 포트
    cors_origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000', // CORS 허용 도메인
    cors_credentials: process.env['CORS_CREDENTIALS'] === 'true', // 쿠키 포함 요청 허용 여부
    app_name: process.env['APP_NAME'] || 'app_name', // 서비스 이름
    logLevel: process.env['LOG_LEVEL'] || 'info', // 로그 레벨 (debug/info/warn/error)
    bcryptSaltRounds: Number(process.env['BCRYPT_SALT_ROUNDS']) || 10, // 비밀번호 해시 강도
    rateLimitWindowMs: Number(process.env['RATE_LIMIT_WINDOW_MS']) || 15 * 60 * 1000, // rate limit 시간 제한
    rateLimitMax: Number(process.env['RATE_LIMIT_MAX']) || 100, // 시간 제한당 허용 요청 수
    compression_threshold: Number(process.env['COMPRESSION_THRESHOLD']) || 1024, // gzip 최소 크기
    compression_level: Number(process.env['COMPRESSION_LEVEL']) || 6, // gzip 압축 레벨
    fileSizeLimit: Number(process.env['FILE_SIZE_LIMIT']) || 5 * 1024 * 1024, // 5MB
    cookieMaxAge: ms((process.env['REFRESH_TOKEN_EXPIRES_IN'] as StringValue) ?? '7d'),
  },
  auth: {
    accessTokenSecretKey: process.env['ACCESS_TOKEN_SECRET_KEY'] ?? 'default-access-token-secret', // 엑세스 토큰 서명키
    refreshTokenSecretKey: process.env['REFRESH_TOKEN_SECRET_KEY'] ?? 'default-refresh-token-secret', // 리프레시 토큰 서명키
    accessTokenExpiresIn: (process.env['ACCESS_TOKEN_EXPIRES_IN'] as StringValue) ?? '1h', // 엑세스 토큰 만료 시간
    refreshTokenExpiresIn: (process.env['REFRESH_TOKEN_EXPIRES_IN'] as StringValue) ?? '7d', // 리프레시 토큰 만료 시간
    maxDevice: Number(process.env['MAX_DEVICE']) || 3,
  },
  aws: {
    // 환경변수가 없으면 'test-key' 같은 임시 문자열이 들어가도록 설정
    accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || 'test-access-key',
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || 'test-secret-key',
    region: process.env['AWS_REGION'] || 'ap-northeast-2',
    bucketName: process.env['AWS_BUCKET_NAME'] || 'test-bucket-name',
  },
};
