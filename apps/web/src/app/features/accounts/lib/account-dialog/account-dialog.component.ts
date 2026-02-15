import { Component, EventEmitter, Input, Output, OnChanges, OnInit, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AccountsService, Account } from '../../accounts.service';
import { TOP_PROP_FIRMS } from '../../../../core/constants/brokers.const';

@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, AutoCompleteModule],
  templateUrl: './account-dialog.component.html',
  styleUrl: './account-dialog.component.scss'
})
export class AccountDialogComponent implements OnChanges, OnInit {
  @Input() visible: boolean = false;
  @Input() account: Account | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  accountForm: FormGroup;
  loading: boolean = false;

  userBrokers: string[] = [];
  filteredBrokers: string[] = [];

  private fb = inject(FormBuilder);
  private accountsService = inject(AccountsService);

  accountTypes = [
    { label: 'Capital Propio', value: 'PERSONAL' },
    { label: 'Cuenta de Fondeo (Prop Firm)', value: 'PROP_FIRM' }
  ];

  marketTypes = [
    { label: 'CFD', value: 'CFD' },
    { label: 'Futuros', value: 'FUTURES' },
    { label: 'Spot', value: 'SPOT' },
    { label: 'Criptomonedas', value: 'CRYPTO' },
    { label: 'Acciones (Stocks)', value: 'STOCKS' }
  ];

  currencies = [
      { label: 'USD - Dólar Estadounidense', value: 'USD' },
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'GBP - Libra Esterlina', value: 'GBP' }
  ];

  propFirmStatusOptions = [
    { label: 'Challenge / Evaluación', value: 'CHALLENGE' },
    { label: 'Fondeada / funded', value: 'FUNDED' }
  ];

  constructor() {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      currency: ['USD', Validators.required],
      initialBalance: [0, [Validators.required, Validators.min(0)]],
      type: ['PERSONAL', Validators.required],
      market: ['CFD', Validators.required],
      broker: [''],
      propFirmStatus: [null],
      externalId: [''],
      defaultRisk: [0, [Validators.min(0)]],
      profitTarget: [null],
      dailyLossLimit: [null],
      maxLossLimit: [null],
    });
  }

  ngOnInit() {
    this.loadUserBrokers();
  }

  loadUserBrokers() {
    this.accountsService.getBrokers().subscribe(brokers => {
      this.userBrokers = brokers;
    });
  }

  searchBrokers(event: any) {
      const query = event.query.toLowerCase();
      const allBrokers = Array.from(new Set([...TOP_PROP_FIRMS, ...this.userBrokers]));
      this.filteredBrokers = allBrokers.filter(b => b.toLowerCase().includes(query));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['account'] && this.account) {
      this.accountForm.patchValue({
        name: this.account.name,
        currency: this.account.currency,
        initialBalance: this.account.initialBalance,
        type: this.account.type || 'PERSONAL',
        market: this.account.market || 'CFD',
        broker: this.account.broker || '',
        propFirmStatus: this.account.propFirmStatus || null,
        externalId: this.account.externalId || '',
        defaultRisk: this.account.defaultRisk || 0,
        profitTarget: this.account.profitTarget ?? null,
        dailyLossLimit: this.account.dailyLossLimit ?? null,
        maxLossLimit: this.account.maxLossLimit ?? null,
      });
    } else if (changes['account'] && !this.account) {
        this.accountForm.reset({
            name: '',
            currency: 'USD',
            initialBalance: 0,
            type: 'PERSONAL',
            market: 'CFD',
            broker: '',
            externalId: '',
            defaultRisk: 0,
            profitTarget: null,
            dailyLossLimit: null,
            maxLossLimit: null,
        });
    }
  }

  hideDialog() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  saveAccount() {
    if (this.accountForm.invalid) return;

    this.loading = true;
    const formValue = this.accountForm.value;

    const request$ = (this.account && this.account.id) ?
        this.accountsService.update(this.account.id, formValue) :
        this.accountsService.create(formValue);

    request$.subscribe({
        next: (response: any) => {
            this.loading = false;
            // The update call might return a status/count, create returns the object
            this.saved.emit(response);
            this.hideDialog();
            this.loadUserBrokers();
        },
        error: () => {
            this.loading = false;
        }
    });
  }
}
