import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { CalendarEvent } from '../../models/calendar-event';

@Component({
  selector: 'app-economic-calendar',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink, FormsModule,
    TableModule, TagModule, ButtonModule, DatePickerModule,
    SelectModule, InputTextModule, IftaLabelModule,
    ConfirmDialogModule, ProgressSpinnerModule, PageLayoutComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-layout
      title="Calendario Económico"
      subtitle="Eventos que pueden bloquear la operativa (NFP, festivos, etc.)">

      <div actions>
        <a routerLink="/funding" class="text-primary text-sm hover:underline">
          <i class="pi pi-arrow-left mr-1"></i>Overview
        </a>
      </div>

      <!-- Quick add form -->
      <div class="flex flex-wrap gap-3 items-end bg-surface-50 rounded-2xl p-4 border border-surface-200 mb-6">
        <p-iftalabel>
          <p-datepicker [(ngModel)]="newDate" dateFormat="yy-mm-dd" inputId="ev-date" />
          <label for="ev-date">Fecha</label>
        </p-iftalabel>

        <p-iftalabel>
          <p-select [(ngModel)]="newType" [options]="typeOptions" optionLabel="label" optionValue="value"
                    inputId="ev-type" />
          <label for="ev-type">Tipo</label>
        </p-iftalabel>

        <p-iftalabel class="flex-1 min-w-[160px]">
          <input pInputText id="ev-label" [(ngModel)]="newLabel" />
          <label for="ev-label">Descripción</label>
        </p-iftalabel>

        <p-button label="Añadir" icon="pi pi-plus" size="small" (onClick)="addEvent()" />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <p-progressSpinner strokeWidth="3" animationDuration="1s" />
        </div>
      } @else if (events().length === 0) {
        <p class="text-gray-400 text-sm text-center py-8">No se encontraron eventos.</p>
      } @else {
        <div class="bullish-table-container">
          <p-table [value]="events()" [rows]="20" [paginator]="events().length > 20"
                   [size]="'small'"
                   [stripedRows]="true"
                   [rowHover]="true"
                   dataKey="id">
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th class="text-center">Bloquea</th>
                <th class="text-center" style="width: 5rem"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ev>
              <tr>
                <td>{{ ev.date | date:'mediumDate' }}</td>
                <td>
                  <p-tag [value]="ev.type" [severity]="getTypeSeverity(ev.type)" />
                </td>
                <td>{{ ev.label }}</td>
                <td class="text-center">
                  <p-tag [value]="ev.blocksTrading ? 'Sí' : 'No'"
                         [severity]="ev.blocksTrading ? 'danger' : 'secondary'" />
                </td>
                <td class="text-center">
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small"
                            (onClick)="confirmDelete(ev)" />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center text-gray-400 py-4">No hay eventos.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <p-confirmDialog />
    </app-page-layout>
  `,
})
export class EconomicCalendarComponent implements OnInit {
  private api = inject(FundingApiService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(true);
  events = signal<CalendarEvent[]>([]);

  newDate: Date | null = null;
  newType = 'CUSTOM';
  newLabel = '';

  typeOptions = [
    { label: 'NFP', value: 'NFP' },
    { label: 'Festivo', value: 'HOLIDAY' },
    { label: 'Custom', value: 'CUSTOM' },
  ];

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.api.getCalendarEvents().subscribe({
      next: evs => {
        this.events.set(evs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addEvent() {
    if (!this.newDate || !this.newLabel) return;
    const dateStr = this.newDate.toISOString().split('T')[0];
    this.api.createCalendarEvent({
      date: dateStr,
      type: this.newType,
      label: this.newLabel,
    }).subscribe(() => {
      this.newDate = null;
      this.newLabel = '';
      this.loadEvents();
    });
  }

  confirmDelete(ev: CalendarEvent) {
    this.confirmationService.confirm({
      message: `¿Eliminar "${ev.label}" del ${ev.date}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.deleteEvent(ev.id),
    });
  }

  deleteEvent(id: string) {
    this.api.deleteCalendarEvent(id).subscribe(() => this.loadEvents());
  }

  getTypeSeverity(type: string): 'danger' | 'warn' | 'secondary' | 'info' {
    switch (type) {
      case 'NFP': return 'danger';
      case 'HOLIDAY': return 'warn';
      default: return 'secondary';
    }
  }
}
