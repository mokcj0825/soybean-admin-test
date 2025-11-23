
export class SysLoginLog {
  constructor(private prisma: PrismaService) {

  }

  async save(loginLog: Omit<SysLoginLog, 'id' | 'loginTime' | 'createdAt'>): Promise<void> {
    await this.prisma.sysLoginLog.create({
      data: {
        userId: loginLog.userId,
        username: loginLog.username,
        domain: loginLog.domain,
        loginTime: new Date(),
        ip: loginLog.ip,
        port: loginLog.port,
        address: loginLog.address,
        userAgent: loginLog.userAgent,
        requestId: loginLog.requestId,
        type: loginLog.type,
        createdAt: new Date(),
        createdBy: loginLog.userId,
      },
    });
  }
}
