import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      include: {
        trades: {
          select: {
            pnlNet: true,
          },
        },
      },
    });

    return accounts.map((account) => {
      const totalPnl = account.trades.reduce(
        (acc, trade) => acc + Number(trade.pnlNet),
        0,
      );
      const balance = Number(account.initialBalance) + totalPnl;

      // Clean up the object to return
      const { trades, ...accountData } = account;
      return {
        ...accountData,
        balance,
        initialBalance: Number(account.initialBalance),
      };
    });
  }

  async getDistinctBrokers(userId: string): Promise<string[]> {
    const results = await this.prisma.account.findMany({
      where: { userId, broker: { not: null } },
      select: { broker: true },
      distinct: ['broker'],
    });
    return results.map((r) => r.broker).filter(Boolean) as string[];
  }

  findOne(id: string, userId: string) {
    return this.prisma.account.findFirst({
      where: { id, userId },
    });
  }

  update(id: string, userId: string, updateAccountDto: UpdateAccountDto) {
    return this.prisma.account.updateMany({
      where: { id, userId },
      data: updateAccountDto,
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.account.deleteMany({
      where: { id, userId },
    });
  }
}
