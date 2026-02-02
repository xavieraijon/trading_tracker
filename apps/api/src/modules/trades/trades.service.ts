import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { parseMT5Html } from './mt5-parser';

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

  private calculateTradeMetrics(data: any) {
    const { side, quantity, entryPrice, exitPrice, fees, swap, commission, riskAmount } = data;

    if (entryPrice && exitPrice && quantity) {
      const q = Number(quantity);
      const entry = Number(entryPrice);
      const exit = Number(exitPrice);
      const f = Number(fees || 0);
      const s = Number(swap || 0);
      const c = Number(commission || 0);

      let pnlGross = 0;
      if (side === 'LONG') {
        pnlGross = (exit - entry) * q;
      } else {
        pnlGross = (entry - exit) * q;
      }

      const pnlNet = pnlGross - f - s - c;

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

  async getCalendarStats(userId: string, accountId?: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
        closeAt: { not: null }
      },
      select: {
        closeAt: true,
        pnlNet: true,
        side: true
      },
      orderBy: { closeAt: 'asc' }
    });

    const dailyStats = new Map<string, { pnl: number; count: number; wins: number; losses: number }>();

    trades.forEach(trade => {
      // Use YYYY-MM-DD
      const dateKey = trade.closeAt.toISOString().split('T')[0];
      const pnl = Number(trade.pnlNet);

      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, { pnl: 0, count: 0, wins: 0, losses: 0 });
      }

      const stats = dailyStats.get(dateKey);
      stats.pnl += pnl;
      stats.count += 1;
      if (pnl > 0) stats.wins++;
      if (pnl < 0) stats.losses++;
    });

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      pnl: stats.pnl,
      count: stats.count,
      wins: stats.wins,
      losses: stats.losses
    }));
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

  async importMt5(userId: string, accountId: string, html: string) {
    const parsedTrades = parseMT5Html(html);
    let importedCount = 0;
    let skippedCount = 0;

    for (const pt of parsedTrades) {
      // Check if already exists or is invalid
      if (!pt.externalId) continue;

      const existing = await this.prisma.trade.findFirst({
        where: {
          accountId,
          externalId: pt.externalId
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await this.prisma.trade.create({
        data: {
          userId,
          accountId,
          instrument: pt.instrument,
          side: pt.side,
          openAt: pt.openAt,
          closeAt: pt.closeAt,
          entryPrice: pt.entryPrice,
          exitPrice: pt.exitPrice,
          quantity: pt.quantity,
          commission: pt.commission,
          swap: pt.swap,
          pnlGross: pt.pnlGross,
          pnlNet: pt.pnlNet,
          externalId: pt.externalId,
          notes: 'Importado de MT5'
        }
      });
      importedCount++;
    }

    return { imported: importedCount, skipped: skippedCount, total: parsedTrades.length };
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
