import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(req.user.userId, createAccountDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.accountsService.findAll(req.user.userId);
  }

  @Get('brokers')
  getBrokers(@Request() req) {
    return this.accountsService.getDistinctBrokers(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.accountsService.findOne(id, req.user.userId);
  }

  @Patch(':id/status')
  changeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: AccountStatus,
  ) {
    return this.accountsService.changeStatus(id, req.user.userId, status);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(id, req.user.userId, updateAccountDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.accountsService.remove(id, req.user.userId);
  }
}
