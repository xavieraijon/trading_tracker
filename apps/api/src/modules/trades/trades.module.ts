import { Module, forwardRef } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [forwardRef(() => FundingModule)],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
