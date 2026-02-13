import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayoutRequestStatus, OperationalState, CycleStatus } from '@prisma/client';
import { CycleService } from './cycle.service';
import { SnapshotService } from './snapshot.service';
import { StateMachineService } from './state-machine.service';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { UpdatePayoutDto } from '../dto/update-payout.dto';

@Injectable()
export class PayoutService {
  constructor(
    private prisma: PrismaService,
    private cycleService: CycleService,
    private snapshotService: SnapshotService,
    private stateMachine: StateMachineService,
  ) {}

  /** List payout requests for a user, optionally filtered. */
  async findAll(userId: string, filters: { accountId?: string; status?: string } = {}) {
    const where: any = {
      account: { userId },
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.status ? { status: filters.status as PayoutRequestStatus } : {}),
    };
    return this.prisma.payoutRequest.findMany({
      where,
      include: {
        account: { select: { name: true, broker: true } },
        cycle: { select: { startDate: true, cycleStartBalance: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  /** Request a payout – validates account is in PROFIT state. */
  async create(userId: string, dto: CreatePayoutDto) {
    // Verify account belongs to user and is funded
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, type: 'PROP_FIRM', propFirmStatus: 'FUNDED' },
    });
    if (!account) throw new NotFoundException('Funded account not found');

    // Verify cycle belongs to account and is ACTIVE
    const cycle = await this.prisma.accountCycle.findFirst({
      where: { id: dto.cycleId, accountId: dto.accountId, status: CycleStatus.ACTIVE },
    });
    if (!cycle) throw new NotFoundException('Active cycle not found for this account');

    // Verify snapshot state is PROFIT
    const snapshot = await this.snapshotService.findByAccount(dto.accountId);
    if (!snapshot || snapshot.operationalState !== OperationalState.PROFIT) {
      throw new BadRequestException('Account must be in PROFIT state to request a payout');
    }

    // Validate FSM transition
    this.stateMachine.transition(snapshot.operationalState, 'payout_requested');

    const payout = await this.prisma.payoutRequest.create({
      data: {
        accountId: dto.accountId,
        cycleId: dto.cycleId,
        eligibleDate: new Date(dto.eligibleDate),
      },
    });

    // Update snapshot to PAYOUT_REQUESTED
    await this.snapshotService.upsertSnapshot({
      accountId: dto.accountId,
      currentCycleId: dto.cycleId,
      operationalState: OperationalState.PAYOUT_REQUESTED,
      balance: Number(snapshot.balance),
      cycleStartBalance: Number(snapshot.cycleStartBalance),
      daysToPayoutEligible: snapshot.daysToPayoutEligible,
    });

    return payout;
  }

  /**
   * Update payout status (admin action).
   * When status = PAID → close current cycle and open new one.
   */
  async update(payoutId: string, dto: UpdatePayoutDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { cycle: true, account: true },
    });
    if (!payout) throw new NotFoundException('Payout request not found');

    const snapshot = await this.snapshotService.findByAccount(payout.accountId);

    // Validate transitions via FSM
    if (dto.status === PayoutRequestStatus.PROCESSING) {
      this.stateMachine.transition(
        snapshot?.operationalState ?? OperationalState.PAYOUT_REQUESTED,
        'payout_processing',
      );
    }

    if (dto.status === PayoutRequestStatus.PAID) {
      this.stateMachine.transition(
        snapshot?.operationalState ?? OperationalState.PAYOUT_PROCESSING,
        'payout_paid',
      );
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: dto.status,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        amount: dto.amount,
      },
    });

    // If PAID → close cycle + open new cycle at the new balance
    if (dto.status === PayoutRequestStatus.PAID) {
      const paidDate = dto.paidAt ? new Date(dto.paidAt) : new Date();

      // Close old cycle
      await this.cycleService.closeCycle(payout.cycleId, paidDate);

      // The new cycle starts at the account's initialBalance (post-payout reset)
      const newCycleStartBalance = Number(payout.account.initialBalance);

      const newCycle = await this.cycleService.createCycle({
        accountId: payout.accountId,
        startDate: paidDate,
        cycleStartBalance: newCycleStartBalance,
        profitTargetPct: Number(payout.cycle.profitTargetPct),
      });

      // Update snapshot → BREAK_EVEN for new cycle
      await this.snapshotService.upsertSnapshot({
        accountId: payout.accountId,
        currentCycleId: newCycle.id,
        operationalState: OperationalState.BREAK_EVEN,
        balance: newCycleStartBalance,
        cycleStartBalance: newCycleStartBalance,
        daysToPayoutEligible: null,
      });
    } else if (dto.status === PayoutRequestStatus.PROCESSING) {
      // Update snapshot state to PAYOUT_PROCESSING
      if (snapshot) {
        await this.snapshotService.upsertSnapshot({
          accountId: payout.accountId,
          currentCycleId: payout.cycleId,
          operationalState: OperationalState.PAYOUT_PROCESSING,
          balance: Number(snapshot.balance),
          cycleStartBalance: Number(snapshot.cycleStartBalance),
          daysToPayoutEligible: snapshot.daysToPayoutEligible,
        });
      }
    }

    return updated;
  }
}
