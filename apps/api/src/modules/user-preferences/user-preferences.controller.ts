import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get('dashboard')
  getDashboardLayout(@Request() req) {
    return this.preferencesService.getDashboardLayout(req.user.userId);
  }

  @Put('dashboard')
  saveDashboardLayout(@Request() req, @Body() body: { dashboard: any }) {
    return this.preferencesService.saveDashboardLayout(req.user.userId, body.dashboard);
  }

  @Get('theme')
  getTheme(@Request() req) {
    return this.preferencesService.getTheme(req.user.userId);
  }

  @Put('theme')
  saveTheme(@Request() req, @Body() body: { theme: string }) {
    return this.preferencesService.saveTheme(req.user.userId, body.theme);
  }
}
