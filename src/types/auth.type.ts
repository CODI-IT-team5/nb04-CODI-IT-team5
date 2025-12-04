export interface CreateRefreshTokenInput {
  token: string;
  userId: string;
  expiresAt: Date;
  issuedAt: Date;
}

export interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}
