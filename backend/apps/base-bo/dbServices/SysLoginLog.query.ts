import { Prisma } from '@prisma/client';

import {PrismaService} from "@lib/shared/prisma/prisma.service";

import {SysLoginLog} from "../dbObjects/SysLoginLog";

export class SysLoginLogQuery {
  constructor(private prisma: PrismaService) {

  }

  async pageLoginLogs(
    query: Partial<Pick<SysLoginLog, 'username' | 'domain' | 'address' | 'type'> & {
      current: number;
      size: number;
    }>
  ): Promise<any> {
    const where = Prisma.SysLoginLogWhereInput = {};

    if (query.username) {
      where.username = {
        contains: query.username,
      };
    }

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.address) {
      where.address = {
        contains: query.address,
      };
    }

    if (query.type) {
      where.type = query.type;
    }

    const loginLogs = await this.prisma.sysLoginLog.findMany({
      where: where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [
        {
          loginTime: 'desc',
        },
      ],
    });

    const total = await this.prisma.sysLoginLog.count({ where: where });

    return {
      current: query.current,
      size: query.size,
      total,
      records: loginLogs
    }
  }
}
