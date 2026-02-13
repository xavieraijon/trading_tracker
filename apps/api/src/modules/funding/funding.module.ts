import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';

// Services
import { StateMachineService } from './services/state-machine.service';
import { CycleService } from './services/cycle.service';
import { DailyStatusService } from './services/daily-status.service';
import { SnapshotService } from './services/snapshot.service';
import { PayoutService } from './services/payout.service';
import { CalendarService } from './services/calendar.service';
import { PlanDayService } from './services/plan-day.service';
import { BackfillService } from './services/backfill.service';

// Controllers
import { FundingCyclesController } from './controllers/funding-cycles.controller';
import { DailyStatusController } from './controllers/daily-status.controller';
import { PlanDayController } from './controllers/plan-day.controller';
import { PayoutsController } from './controllers/payouts.controller';
import { CalendarEventsController } from './controllers/calendar-events.controller';
import { RebuildController } from './controllers/rebuild.controller';

// Jobs
import { DayCloseJob } from './jobs/day-close.job';
import { PayoutWatcherJob } from './jobs/payout-watcher.job';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [
    FundingCyclesController,
    DailyStatusController,
    PlanDayController,
    PayoutsController,
    CalendarEventsController,
    RebuildController,
  ],
  providers: [
    StateMachineService,
    CycleService,
    DailyStatusService,
    SnapshotService,
    PayoutService,
    CalendarService,
    PlanDayService,
    BackfillService,
    DayCloseJob,
    PayoutWatcherJob,
  ],
  exports: [BackfillService, CycleService, SnapshotService],
})
export class FundingModule {}
