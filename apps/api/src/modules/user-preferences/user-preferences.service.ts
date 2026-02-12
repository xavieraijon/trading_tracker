import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getDashboardLayout(userId: string) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { dashboard: true },
    });
    return { dashboard: pref?.dashboard ?? null };
  }

  async saveDashboardLayout(userId: string, dashboard: any) {
    await this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, dashboard },
      update: { dashboard },
    });
    return { success: true };
  }
}
