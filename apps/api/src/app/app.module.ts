import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { AccountsModule } from '../modules/accounts/accounts.module';
import { TradesModule } from '../modules/trades/trades.module';
import { UserPreferencesModule } from '../modules/user-preferences/user-preferences.module';
import { FundingModule } from '../modules/funding/funding.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AccountsModule, TradesModule, UserPreferencesModule, FundingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
