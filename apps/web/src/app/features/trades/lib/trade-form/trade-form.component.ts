import { Component, EventEmitter, Input, Output, OnChanges, inject, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { TradesService, Trade, CreateTradeDto } from '../../trades.service';
import { AccountsService, Account } from '../../../accounts/accounts.service';

@Component({
  selector: 'app-trade-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    SelectButtonModule,
    TextareaModule
  ],
  templateUrl: './trade-form.component.html',
  styleUrl: './trade-form.component.scss'
})
export class TradeFormDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() trade: Trade | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  tradeForm: FormGroup;
  accounts: Account[] = [];
  loading: boolean = false;

  sideOptions = [
    { label: 'LONG', value: 'LONG' },
    { label: 'SHORT', value: 'SHORT' }
  ];

  private fb = inject(FormBuilder);
  private tradesService = inject(TradesService);
  private accountsService = inject(AccountsService);

  constructor() {
    this.tradeForm = this.fb.group({
      accountId: ['', Validators.required],
      instrument: ['', Validators.required],
      side: ['LONG', Validators.required],
      openAt: [new Date(), Validators.required],
      entryPrice: [null],
      quantity: [1, [Validators.required, Validators.min(0)]],
      fees: [0],
      riskAmount: [null],
      exitPrice: [null],
      closeAt: [null],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountsService.findAll().subscribe(data => {
      this.accounts = data;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['trade'] && this.trade) {
      this.tradeForm.patchValue({
        accountId: this.trade.accountId,
        instrument: this.trade.instrument,
        side: this.trade.side,
        openAt: new Date(this.trade.openAt),
        entryPrice: this.trade.entryPrice,
        quantity: this.trade.quantity,
        fees: this.trade.fees,
        riskAmount: this.trade.riskAmount,
        exitPrice: this.trade.exitPrice,
        closeAt: this.trade.closeAt ? new Date(this.trade.closeAt) : null,
        notes: this.trade.notes
      });
    } else if (changes['trade'] && !this.trade) {
      this.tradeForm.reset({
        accountId: '',
        instrument: '',
        side: 'LONG',
        openAt: new Date(),
        entryPrice: null,
        quantity: 1,
        fees: 0,
        riskAmount: null,
        exitPrice: null,
        closeAt: null,
        notes: ''
      });
    }
  }

  hideDialog() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  saveTrade() {
    if (this.tradeForm.invalid) return;

    this.loading = true;
    const formValue = this.tradeForm.value;

    const request$ = this.trade ?
      this.tradesService.update(this.trade.id, formValue) :
      this.tradesService.create(formValue as CreateTradeDto);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
        this.hideDialog();
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
