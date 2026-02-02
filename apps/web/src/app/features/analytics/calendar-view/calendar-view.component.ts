import { Component, OnInit, inject, signal, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule, Popover } from 'primeng/popover';
import { TableModule } from 'primeng/table';
import { TradesService, Trade } from '../../trades/trades.service';
import { FilterStore } from '../../../core/filter.store';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  pnl?: number;
  tradesCount?: number;
  wins?: number;
  losses?: number;
  trades?: Trade[];
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
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TooltipModule, PopoverModule, TableModule],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss'
})
export class CalendarViewComponent implements OnInit {
  currentDate = signal(new Date());
  calendarWeeks = signal<CalendarWeek[]>([]);
  monthlyStats = signal({ pnl: 0, trades: 0, winRate: 0 });
  loading = signal(false);
  selectedDay = signal<CalendarDay | null>(null);

  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total'];

  private tradesService = inject(TradesService);
  private filterStore = inject(FilterStore);

  constructor() {
    effect(() => {
        const accountId = this.filterStore.selectedAccountId();
        this.loadCalendarData(accountId);
    });
  }

  ngOnInit() {
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

    // Fetch both aggregated stats and individual trades to show details
    this.tradesService.getCalendarStats(id).subscribe({
      next: (stats) => {
        this.tradesService.findAll(id).subscribe({
            next: (trades) => {
                this.generateCalendar(stats, trades);
                this.calculateMonthlyStats(stats);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  generateCalendar(stats: any[], allTrades: Trade[]) {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

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

    // Group all trades by date (string YYYY-MM-DD)
    const tradesByDate = new Map<string, Trade[]>();
    allTrades.forEach(t => {
        if (!t.closeAt) return;
        const dateKey = new Date(t.closeAt).toISOString().split('T')[0];
        if (!tradesByDate.has(dateKey)) tradesByDate.set(dateKey, []);
        tradesByDate.get(dateKey)?.push(t);
    });

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        const dayStats = statsMap.get(dateStr);
        const dayTrades = tradesByDate.get(dateStr) || [];

        days.push({
            date: date,
            day: i,
            isCurrentMonth: true,
            pnl: dayStats?.pnl,
            tradesCount: dayStats?.count,
            wins: dayStats?.wins,
            losses: dayStats?.losses,
            trades: dayTrades
        });
    }

    // Next month padding
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
        const summary = weekDays.reduce((acc, d) => {
            if (d.pnl) acc.pnl += d.pnl;
            if (d.tradesCount) acc.tradesCount += d.tradesCount;
            return acc;
        }, { pnl: 0, tradesCount: 0, label: `Semana ${weeks.length + 1}`, isCurrentMonth: weekDays.some(d => d.isCurrentMonth) });

        weeks.push({ days: weekDays, summary });
    }

    this.calendarWeeks.set(weeks);
  }

  calculateMonthlyStats(stats: any[]) {
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
      if (!pnl && pnl !== 0) return 'text-slate-400';
      return pnl >= 0 ? 'text-emerald-600' : 'text-rose-600';
  }

  toggleDetails(event: MouseEvent, day: CalendarDay, op: Popover) {
    if (!day.trades || day.trades.length === 0) return;

    // Detenemos propagación para que el listener de PrimeNG no intente cerrar
    // el panel mientras cambiamos el estado interno.
    event.stopPropagation();

    const currentDay = this.selectedDay();
    const isDifferentDay = currentDay && currentDay.date !== day.date;
    const anchor = event.currentTarget as HTMLElement;

    this.selectedDay.set(day);

    if (isDifferentDay) {
        // En PrimeNG 21, toggle() sobre un target distinto fuerza un cierre.
        // Para que sea instantáneo, forzamos el show y el alineamiento manual.
        const popover = op as any;
        popover.show(event, anchor);

        // Si ya estaba visible, forzamos el reposicionamiento inmediato al nuevo día.
        // Hacemos un segundo align en el siguiente macrotask para asegurar que,
        // una vez el P-Table ha renderizado su contenido, el cálculo de altura sea real.
        if (popover.overlayVisible) {
            popover.align();
            setTimeout(() => popover.align(), 0);
        }
    } else {
        // Mismo día: cerrar si está abierto, abrir si está cerrado
        op.toggle(event);
    }
  }

  getTradeTooltip(day: CalendarDay): string {
      if (!day.tradesCount) return 'Sin operaciones';
      const wins = day.wins || 0;
      const losses = day.losses || 0;
      return `${day.tradesCount} Operaciones (${wins} Ganadas, ${losses} Perdidas)`;
  }
}
