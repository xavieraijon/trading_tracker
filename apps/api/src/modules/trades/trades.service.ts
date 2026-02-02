import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

  private calculateTradeMetrics(data: any) {
    const { side, quantity, entryPrice, exitPrice, fees, riskAmount } = data;

    if (entryPrice && exitPrice && quantity) {
      const q = Number(quantity);
      const entry = Number(entryPrice);
      const exit = Number(exitPrice);
      const f = Number(fees || 0);

      let pnlGross = 0;
      if (side === 'LONG') {
        pnlGross = (exit - entry) * q;
      } else {
        pnlGross = (entry - exit) * q;
      }

      const pnlNet = pnlGross - f;

      let resultR = null;
      if (riskAmount && Number(riskAmount) > 0) {
        resultR = pnlNet / Number(riskAmount);
      }

      return { pnlGross, pnlNet, resultR };
    }

    return {};
  }

  async create(userId: string, createTradeDto: CreateTradeDto) {
    const { accountId, ...tradeData } = createTradeDto;

    // Verify account ownership
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const metrics = this.calculateTradeMetrics(tradeData);

    return this.prisma.trade.create({
      data: {
        ...tradeData,
        ...metrics,
        userId,
        accountId,
        pnlNet: metrics.pnlNet ?? 0,
      },
    });
  }

  findAll(userId: string, accountId?: string) {
    return this.prisma.trade.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
      },
      include: {
        account: {
          select: { name: true, currency: true }
        }
      },
      orderBy: { openAt: 'desc' },
    });
  }

  findOne(id: string, userId: string) {
    return this.prisma.trade.findFirst({
      where: { id, userId },
      include: {
        account: true
      }
    });
  }

  async update(id: string, userId: string, updateTradeDto: UpdateTradeDto) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, userId },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Mergem current trade data with updates to calculate metrics correctly
    const mergedData = { ...trade, ...updateTradeDto };
    const metrics = this.calculateTradeMetrics(mergedData);

    return this.prisma.trade.update({
      where: { id },
      data: {
        ...updateTradeDto,
        ...metrics
      },
    });
  }

  async getStats(userId: string, accountId?: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
        closeAt: { not: null }
      },
      orderBy: { closeAt: 'asc' }
    });

    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        totalPnL: 0,
        equityCurve: []
      };
    }

    const winningTrades = trades.filter(t => Number(t.pnlNet) > 0);
    const losingTrades = trades.filter(t => Number(t.pnlNet) < 0);

    const grossProfit = winningTrades.reduce((acc, t) => acc + Number(t.pnlNet), 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + Number(t.pnlNet), 0));

    const totalPnL = trades.reduce((acc, t) => acc + Number(t.pnlNet), 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    // Equity Curve starting from 0 (normalized) or from account initial balance if only one account
    let currentEquity = 0;
    const equityCurve = trades.map(t => {
      currentEquity += Number(t.pnlNet);
      return {
        date: t.closeAt,
        equity: currentEquity
      };
    });

    return {
      totalTrades: trades.length,
      winRate,
      profitFactor,
      totalPnL,
      equityCurve
    };
  }

  async exportCsv(userId: string, accountId?: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
      },
      include: {
        account: {
          select: { name: true, currency: true }
        }
      },
      orderBy: { openAt: 'desc' },
    });

    const headers = [
      'Fecha Apertura',
      'Fecha Cierre',
      'Cuenta',
      'Instrumento',
      'L/S',
      'Cantidad',
      'Precio Entrada',
      'Precio Salida',
      'Comisiones',
      'Riesgo',
      'PnL Net',
      'Resultado R',
      'Notas'
    ].join(',');

    const rows = trades.map(t => [
      t.openAt.toISOString(),
      t.closeAt?.toISOString() || '',
      t.account?.name || '',
      t.instrument,
      t.side,
      t.quantity,
      t.entryPrice || '',
      t.exitPrice || '',
      t.fees,
      t.riskAmount || '',
      t.pnlNet,
      t.resultR || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  async remove(id: string, userId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, userId },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    return this.prisma.trade.delete({
      where: { id },
    });
  }
}
