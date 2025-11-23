export type SysLoginLog = {
  id: string; //no need in response
  userId: string; //no need in response
  username: string;
  domain: string;
  loginTime: Date;
  ip: string;
  port?: number | null;
  address: string;
  userAgent: string;
  requestId: string;
  type: String;
  createdAt: Date;
  createdBy: string; //no need in response
}

export type SysLoginLogPaginationResult = Omit<SysLoginLog, 'id' | 'userId' | 'createdBy'>
