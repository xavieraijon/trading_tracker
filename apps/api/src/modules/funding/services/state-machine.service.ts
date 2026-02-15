import { Injectable, BadRequestException } from '@nestjs/common';
import { OperationalState } from '@prisma/client';

/**
 * Valid state transitions for a funded account within a cycle.
 *
 * Events:
 *   trade_result_posted – a closed trade has been processed
 *   payout_requested    – user asks for payout
 *   payout_processing   – system/admin moves request to processing
 *   payout_paid         – money received → closes cycle & opens new one
 *   calendar_block      – no-trade day (NFP / holiday)
 */

type FsmEvent =
  | 'trade_result_posted'
  | 'payout_requested'
  | 'payout_processing'
  | 'payout_paid'
  | 'calendar_block';

interface TradeContext {
  pnlCycle: number;          // cumulative PnL for current cycle
  cycleStartBalance: number;
  profitTargetPct: number;   // e.g. 2 means 2 %
}

@Injectable()
export class StateMachineService {
  /**
   * Derive the operational state purely from cycle PnL.
   */
  deriveStateFromPnl(ctx: TradeContext): OperationalState {
    const profitPct = (ctx.pnlCycle / ctx.cycleStartBalance) * 100;

    if (profitPct >= ctx.profitTargetPct) {
      return OperationalState.PROFIT;
    }
    if (ctx.pnlCycle < 0) {
      return OperationalState.DRAWDOWN;
    }
    return OperationalState.BREAK_EVEN;
  }

  /**
   * Apply an explicit event and return the new state,
   * validating the transition is legal.
   */
  transition(
    current: OperationalState,
    event: FsmEvent,
    ctx?: TradeContext,
  ): OperationalState {
    switch (event) {
      case 'trade_result_posted': {
        if (
          current === OperationalState.PAYOUT_REQUESTED ||
          current === OperationalState.PAYOUT_PROCESSING
        ) {
          throw new BadRequestException(
            `Cannot post trades while account is in ${current}`,
          );
        }
        if (!ctx) {
          throw new BadRequestException('TradeContext required for trade_result_posted');
        }
        return this.deriveStateFromPnl(ctx);
      }

      case 'payout_requested': {
        if (current !== OperationalState.PROFIT) {
          throw new BadRequestException(
            'Payout can only be requested when account is in PROFIT state',
          );
        }
        return OperationalState.PAYOUT_REQUESTED;
      }

      case 'payout_processing': {
        if (current !== OperationalState.PAYOUT_REQUESTED) {
          throw new BadRequestException(
            'Can only move to PROCESSING from PAYOUT_REQUESTED',
          );
        }
        return OperationalState.PAYOUT_PROCESSING;
      }

      case 'payout_paid': {
        if (
          current !== OperationalState.PAYOUT_REQUESTED &&
          current !== OperationalState.PAYOUT_PROCESSING
        ) {
          throw new BadRequestException(
            'payout_paid requires state PAYOUT_REQUESTED or PAYOUT_PROCESSING',
          );
        }
        // After payout_paid the cycle closes; a new cycle starts at BREAK_EVEN.
        return OperationalState.BREAK_EVEN;
      }

      case 'calendar_block': {
        return OperationalState.REST_DAY;
      }

      default:
        throw new BadRequestException(`Unknown FSM event: ${event}`);
    }
  }
}
