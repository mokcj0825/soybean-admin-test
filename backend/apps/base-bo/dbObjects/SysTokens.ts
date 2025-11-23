export type SysTokens = {
  id: string;
  accessToken: string
  refreshToken: string;
  status: string;
  userId: string;
  username: string;
  domain: string;
  loginTime: Date;
  ip: string;
  port?: number | null;
  address: string;
  userAgent: string;
  requestId: string;
  type: string;
  createdAt: Date;
  createdBy: string;
}
