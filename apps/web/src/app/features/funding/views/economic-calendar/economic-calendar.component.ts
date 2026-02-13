import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { FundingApiService } from '../../services/funding-api.service';
import { CalendarEvent } from '../../models/calendar-event';

@Component({
  selector: 'app-economic-calendar',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    TableModule, TagModule, ButtonModule, DatePickerModule,
    SelectModule, InputTextModule, IftaLabelModule,
    ConfirmDialogModule, ProgressSpinnerModule,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-3xl mx-auto">
      <h2 class="text-xl font-bold">Economic Calendar</h2>

      <!-- Quick add form using PrimeNG inputs -->
      <div class="flex flex-wrap gap-3 items-end bg-surface-50 rounded-lg p-4 border border-surface-200">
        <p-iftalabel>
          <p-datepicker [(ngModel)]="newDate" dateFormat="yy-mm-dd" inputId="ev-date" />
          <label for="ev-date">Date</label>
        </p-iftalabel>

        <p-iftalabel>
          <p-select [(ngModel)]="newType" [options]="typeOptions" optionLabel="label" optionValue="value"
                    inputId="ev-type" />
          <label for="ev-type">Type</label>
        </p-iftalabel>

        <p-iftalabel class="flex-1 min-w-[160px]">
          <input pInputText id="ev-label" [(ngModel)]="newLabel" />
          <label for="ev-label">Label</label>
        </p-iftalabel>

        <p-button label="Add" icon="pi pi-plus" size="small" (onClick)="addEvent()" />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <p-progressSpinner strokeWidth="3" animationDuration="1s" />
        </div>
      } @else if (events().length === 0) {
        <p class="text-gray-400 text-sm text-center py-8">No calendar events found.</p>
      } @else {
        <p-table [value]="events()" [rows]="20" [paginator]="events().length > 20"
                 styleClass="p-datatable-sm p-datatable-striped"
                 [rowHover]="true">
          <ng-template #header>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Label</th>
              <th class="text-center">Blocks</th>
              <th class="text-center" style="width: 5rem"></th>
            </tr>
          </ng-template>
          <ng-template #body let-ev>
            <tr>
              <td>{{ ev.date | date:'mediumDate' }}</td>
              <td>
                <p-tag [value]="ev.type" [severity]="getTypeSeverity(ev.type)" />
              </td>
              <td>{{ ev.label }}</td>
              <td class="text-center">
                <p-tag [value]="ev.blocksTrading ? 'Yes' : 'No'"
                       [severity]="ev.blocksTrading ? 'danger' : 'secondary'" />
              </td>
              <td class="text-center">
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small"
                          (onClick)="confirmDelete(ev)" />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" class="text-center text-gray-400 py-4">No events found.</td>
            </tr>
          </ng-template>
        </p-table>
      }

      <p-confirmDialog />
    </div>
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
    { label: 'Holiday', value: 'HOLIDAY' },
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
      message: `Delete "${ev.label}" on ${ev.date}?`,
      header: 'Confirm Delete',
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
