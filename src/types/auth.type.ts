export interface CreateRefreshTokenInput {
  token: string;
  userId: string;
  expiresAt: Date;
  issuedAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}
