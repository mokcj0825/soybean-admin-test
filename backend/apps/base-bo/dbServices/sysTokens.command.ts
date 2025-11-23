import { PrismaService } from '@lib/shared/prisma/prisma.service';

export class SysTokensCommand {
  constructor(private prisma: PrismaService) {
  }

  async save(tokens: Omit<SysTokens, 'id' | 'loginTime' | 'createdAt'>): Promise<void> {
    await this.prisma.sysTokens.create({
      data:tokens
    })
  }

  async updateTokensStatus(refreshToken: string, status: string): Promise<void> {
    await this.prisma.sysTokens.update({
      where: {
        refreshToken: refreshToken,
      },
      data: {
        status: status,
      },
    });
  }
}
