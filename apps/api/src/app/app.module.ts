import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { AccountsModule } from '../modules/accounts/accounts.module';
import { TradesModule } from '../modules/trades/trades.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AccountsModule, TradesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
