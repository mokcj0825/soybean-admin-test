import { Injectable } from '@nestjs/common';

import { SysTokens } from '../dbObjects/SysTokens';

@Injectable()
export class SysTokensQuery {
  constructor(private prisma: PrismaService) {

  }

  async findTokensByRefreshToken(
    refreshToken: string,
  ): Promise<Omit<SysTokens, 'id'> | null> {
    return this.prisma.sysTokens.findFirst({
      where: { refreshToken },
    });
  }
}

