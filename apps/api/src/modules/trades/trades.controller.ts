import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  create(@Request() req, @Body() createTradeDto: CreateTradeDto) {
    return this.tradesService.create(req.user.userId, createTradeDto);
  }

  @Get('stats')
  getStats(@Request() req, @Query('accountId') accountId?: string) {
    return this.tradesService.getStats(req.user.userId, accountId);
  }

  @Get()
  findAll(@Request() req, @Query('accountId') accountId?: string) {
    return this.tradesService.findAll(req.user.userId, accountId);
  }

  @Get('export')
  async export(@Request() req, @Query('accountId') accountId?: string) {
    return this.tradesService.exportCsv(req.user.userId, accountId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.tradesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateTradeDto: UpdateTradeDto) {
    return this.tradesService.update(id, req.user.userId, updateTradeDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tradesService.remove(id, req.user.userId);
  }
}
