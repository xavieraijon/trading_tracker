import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FundingApiService } from '../../services/funding-api.service';
import { CalendarEvent } from '../../models/calendar-event';

@Component({
  selector: 'app-economic-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-3xl mx-auto">
      <h2 class="text-xl font-bold">Economic Calendar</h2>

      <!-- Quick add form -->
      <div class="flex flex-wrap gap-2 items-end bg-surface-50 rounded-lg p-3 border border-surface-200">
        <div>
          <label class="text-xs text-gray-500 block mb-0.5">Date</label>
          <input type="date" [(ngModel)]="newDate" class="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-0.5">Type</label>
          <select [(ngModel)]="newType" class="border rounded px-2 py-1 text-sm">
            <option value="NFP">NFP</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div class="flex-1 min-w-[120px]">
          <label class="text-xs text-gray-500 block mb-0.5">Label</label>
          <input type="text" [(ngModel)]="newLabel" placeholder="e.g. Non-Farm Payrolls"
                 class="border rounded px-2 py-1 text-sm w-full" />
        </div>
        <button (click)="addEvent()"
                class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 transition">
          Add
        </button>
      </div>

      @if (loading()) {
        <div class="text-gray-400 text-center py-8">Loading...</div>
      } @else if (events().length === 0) {
        <p class="text-gray-400 text-sm text-center py-8">No calendar events found.</p>
      } @else {
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-surface-100">
              <th class="px-3 py-2 text-left">Date</th>
              <th class="px-3 py-2 text-left">Type</th>
              <th class="px-3 py-2 text-left">Label</th>
              <th class="px-3 py-2 text-center">Blocks</th>
              <th class="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            @for (ev of events(); track ev.id) {
              <tr class="border-t border-surface-100 hover:bg-surface-50">
                <td class="px-3 py-2">{{ ev.date | date:'mediumDate' }}</td>
                <td class="px-3 py-2">
                  <span class="text-xs font-semibold px-1.5 py-0.5 rounded"
                        [class.bg-red-100]="ev.type === 'NFP'"
                        [class.bg-yellow-100]="ev.type === 'HOLIDAY'"
                        [class.bg-gray-100]="ev.type === 'CUSTOM'">
                    {{ ev.type }}
                  </span>
                </td>
                <td class="px-3 py-2">{{ ev.label }}</td>
                <td class="px-3 py-2 text-center">{{ ev.blocksTrading ? 'Yes' : 'No' }}</td>
                <td class="px-3 py-2 text-center">
                  <button (click)="deleteEvent(ev.id)" class="text-red-500 hover:text-red-700 text-xs">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class EconomicCalendarComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  events = signal<CalendarEvent[]>([]);

  newDate = '';
  newType = 'CUSTOM';
  newLabel = '';

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
    this.api.createCalendarEvent({
      date: this.newDate,
      type: this.newType,
      label: this.newLabel,
    }).subscribe(() => {
      this.newDate = '';
      this.newLabel = '';
      this.loadEvents();
    });
  }

  deleteEvent(id: string) {
    this.api.deleteCalendarEvent(id).subscribe(() => this.loadEvents());
  }
}
