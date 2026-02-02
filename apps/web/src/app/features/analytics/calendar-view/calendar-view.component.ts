import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { TradesService } from '../../trades/trades.service';
import { FilterStore } from '../../../core/filter.store';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  pnl?: number;
  tradesCount?: number;
  wins?: number;
  losses?: number;
}

interface WeeklySummary {
    label: string;
    pnl: number;
    tradesCount: number;
    isCurrentMonth: boolean;
}

interface CalendarWeek {
    days: CalendarDay[];
    summary: WeeklySummary;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TooltipModule],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss'
})
export class CalendarViewComponent implements OnInit {
  currentDate = signal(new Date());
  calendarWeeks = signal<CalendarWeek[]>([]); // Changed from flat days to weeks
  monthlyStats = signal({ pnl: 0, trades: 0, winRate: 0 });
  loading = signal(false);

  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total']; // Added Total

  private tradesService = inject(TradesService);
  private filterStore = inject(FilterStore);

  constructor() {
    effect(() => {
        const accountId = this.filterStore.selectedAccountId();
        this.loadCalendarData(accountId);
    });
  }

  ngOnInit() {
    // Initial load handled by effect
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.loadCalendarData(this.filterStore.selectedAccountId());
  }

  loadCalendarData(accountId: string | null) {
    this.loading.set(true);
    const id = accountId || undefined;

    this.tradesService.getCalendarStats(id).subscribe({
      next: (data) => {
        this.generateCalendar(data);
        this.calculateMonthlyStats(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  generateCalendar(stats: any[]) {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust for Monday start
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Create flat array of days first, then chunk
    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevMonthLastDay - i),
            day: prevMonthLastDay - i,
            isCurrentMonth: false
        });
    }

    // Current month days
    const statsMap = new Map(stats.map(s => [s.date, s]));

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        const dayStats = statsMap.get(dateStr);

        days.push({
            date: date,
            day: i,
            isCurrentMonth: true,
            pnl: dayStats?.pnl,
            tradesCount: dayStats?.count,
            wins: dayStats?.wins,
            losses: dayStats?.losses
        });
    }

    // Next month padding to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                day: i,
                isCurrentMonth: false
            });
        }
    }

    // Group into weeks
    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < days.length; i += 7) {
        const weekDays = days.slice(i, i + 7);

        // Calculate weekly summary
        const summary = weekDays.reduce((acc, d) => {
            if (d.pnl) acc.pnl += d.pnl;
            if (d.tradesCount) acc.tradesCount += d.tradesCount;
            return acc;
        }, { pnl: 0, tradesCount: 0, label: `Week ${weeks.length + 1}`, isCurrentMonth: weekDays.some(d => d.isCurrentMonth) });

        weeks.push({ days: weekDays, summary });
    }

    this.calendarWeeks.set(weeks);
  }

  calculateMonthlyStats(stats: any[]) {
      // Filter stats for current month only
      const year = this.currentDate().getFullYear();
      const month = this.currentDate().getMonth();

      const currentMonthStats = stats.filter(s => {
          const d = new Date(s.date);
          return d.getFullYear() === year && d.getMonth() === month;
      });

      const totalPnL = currentMonthStats.reduce((acc, s) => acc + (s.pnl || 0), 0);
      const totalTrades = currentMonthStats.reduce((acc, s) => acc + (s.count || 0), 0);
      const wins = currentMonthStats.reduce((acc, s) => acc + (s.wins || 0), 0);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      this.monthlyStats.set({ pnl: totalPnL, trades: totalTrades, winRate });
  }

  getPnlClass(pnl?: number) {
      if (!pnl) return 'text-slate-400';
      return pnl >= 0 ? 'text-emerald-600' : 'text-rose-600';
  }
}
