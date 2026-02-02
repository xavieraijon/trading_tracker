import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('import/mt5')
  @UseInterceptors(FileInterceptor('file'))
  async importMt5(
    @Request() req,
    @Body('accountId') accountId: string,
    @UploadedFile() file: any
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    let html = '';
    const buffer = file.buffer;

    // Detect UTF-16LE (common in MT5 exports) vs UTF-8
    // UTF-16LE BOM is 0xFF 0xFE
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      html = buffer.toString('utf16le');
    } else {
      html = buffer.toString('utf8');

      // Secondary check: if it looks like UTF-16 but no BOM
      if (html.includes('\u0000')) {
        html = buffer.toString('utf16le');
      }
    }

    if (!html || html.length < 100) {
       // Fallback for some weird edge cases
       html = buffer.toString('utf16le');
    }

    return this.tradesService.importMt5(req.user.userId, accountId, html);
  }

  @Post()
  create(@Request() req, @Body() createTradeDto: CreateTradeDto) {
    return this.tradesService.create(req.user.userId, createTradeDto);
  }

  @Get('stats')
  getStats(@Request() req, @Query('accountId') accountId?: string) {
    return this.tradesService.getStats(req.user.userId, accountId);
  }

  @Get('calendar-stats')
  getCalendarStats(@Request() req, @Query('accountId') accountId?: string) {
    return this.tradesService.getCalendarStats(req.user.userId, accountId);
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
