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

  /** Opciones 1–10 % para PT, pérdida diaria y pérdida máxima (estándar en prop firms). */
  percentageOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ label: `${n}%`, value: n }));

  /** Breakpoints del diálogo (PrimeNG): más ancho en desktop, adaptable en móvil. */
  dialogBreakpoints = { '960px': '75vw', '640px': '95vw' };

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
      profitTargetPct: [null as number | null],
      dailyLossLimitPct: [null as number | null],
      maxLossLimitPct: [null as number | null],
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
      const ib = this.account.initialBalance || 0;
      const toPct = (abs: number | null | undefined): number | null => {
        if (abs == null || ib <= 0) return null;
        const pct = (abs / ib) * 100;
        return Math.round(pct * 10) / 10;
      };
      const clampToOption = (pct: number | null): number | null =>
        pct == null ? null : Math.min(10, Math.max(1, Math.round(pct)));
      this.accountForm.patchValue({
        name: this.account.name,
        currency: this.account.currency,
        initialBalance: this.account.initialBalance,
        type: this.account.type || 'PERSONAL',
        market: this.account.market || 'CFD',
        broker: this.account.broker || '',
        propFirmStatus: this.account.propFirmStatus || null,
        externalId: this.account.externalId || '',
        defaultRisk: this.account.defaultRisk ?? 0,
        profitTargetPct: clampToOption(toPct(this.account.profitTarget)),
        dailyLossLimitPct: clampToOption(toPct(this.account.dailyLossLimit)),
        maxLossLimitPct: clampToOption(toPct(this.account.maxLossLimit)),
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
            profitTargetPct: null,
            dailyLossLimitPct: null,
            maxLossLimitPct: null,
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
    const formValue = { ...this.accountForm.value };
    const initialBalance = Number(this.accountForm.get('initialBalance')?.value ?? 0);
    const toAbsolute = (pct: number | null | undefined) =>
      pct != null && initialBalance > 0 ? (initialBalance * Number(pct)) / 100 : null;
    formValue.profitTarget = toAbsolute(this.accountForm.get('profitTargetPct')?.value);
    formValue.dailyLossLimit = toAbsolute(this.accountForm.get('dailyLossLimitPct')?.value);
    formValue.maxLossLimit = toAbsolute(this.accountForm.get('maxLossLimitPct')?.value);
    delete (formValue as Record<string, unknown>)['profitTargetPct'];
    delete (formValue as Record<string, unknown>)['dailyLossLimitPct'];
    delete (formValue as Record<string, unknown>)['maxLossLimitPct'];

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
