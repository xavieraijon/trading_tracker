import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { KtdGridDragHandle, KtdGridResizeHandle } from '@katoid/angular-grid-layout';
import { getWidgetDefinition, type WidgetDefinition } from '../../models/widget-registry';
import { DashboardDataService } from '../../services/dashboard-data.service';

// KPI Widgets
import { NetProfitWidgetComponent } from '../kpi/net-profit-widget.component';
import { WinRateWidgetComponent } from '../kpi/win-rate-widget.component';
import { ProfitFactorWidgetComponent } from '../kpi/profit-factor-widget.component';
import { AvgWinLossWidgetComponent } from '../kpi/avg-win-loss-widget.component';
import { MaxDrawdownWidgetComponent } from '../kpi/max-drawdown-widget.component';
import { TotalTradesWidgetComponent } from '../kpi/total-trades-widget.component';
import { ExpectancyWidgetComponent } from '../kpi/expectancy-widget.component';
import { LargestWinWidgetComponent } from '../kpi/largest-win-widget.component';
import { LargestLossWidgetComponent } from '../kpi/largest-loss-widget.component';
import { StreaksWidgetComponent } from '../kpi/streaks-widget.component';

// Chart Widgets
import { EquityCurveWidgetComponent } from '../charts/equity-curve-widget.component';
import { DrawdownWidgetComponent } from '../charts/drawdown-widget.component';
import { PnlByPeriodWidgetComponent } from '../charts/pnl-by-period-widget.component';
import { GrossPnlDonutWidgetComponent } from '../charts/gross-pnl-donut-widget.component';
import { LongShortDonutWidgetComponent } from '../charts/long-short-donut-widget.component';
import { WinsLossesDonutWidgetComponent } from '../charts/wins-losses-donut-widget.component';
import { PnlByInstrumentWidgetComponent } from '../charts/pnl-by-instrument-widget.component';
import { ActivityByPeriodWidgetComponent } from '../charts/activity-by-period-widget.component';

@Component({
  selector: 'app-widget-host',
  standalone: true,
  imports: [
    CommonModule,
    TooltipModule,
    KtdGridDragHandle,
    KtdGridResizeHandle,
    // KPI
    NetProfitWidgetComponent,
    WinRateWidgetComponent,
    ProfitFactorWidgetComponent,
    AvgWinLossWidgetComponent,
    MaxDrawdownWidgetComponent,
    TotalTradesWidgetComponent,
    ExpectancyWidgetComponent,
    LargestWinWidgetComponent,
    LargestLossWidgetComponent,
    StreaksWidgetComponent,
    // Charts
    EquityCurveWidgetComponent,
    DrawdownWidgetComponent,
    PnlByPeriodWidgetComponent,
    GrossPnlDonutWidgetComponent,
    LongShortDonutWidgetComponent,
    WinsLossesDonutWidgetComponent,
    PnlByInstrumentWidgetComponent,
    ActivityByPeriodWidgetComponent,
  ],
  templateUrl: './widget-host.component.html',
  styleUrl: './widget-host.component.scss',
})
export class WidgetHostComponent {
  widgetId = input.required<string>();
  remove = output<string>();

  dataService = inject(DashboardDataService);

  definition = computed<WidgetDefinition | undefined>(() => getWidgetDefinition(this.widgetId()));
  isKpi = computed(() => this.definition()?.category === 'kpi');
}
