# Prompt completo – MVP Trading Tracker & Journal (Cuentas de fondeo CFDs)
**Stack fijo:** Angular (UI con **PrimeNG**), NestJS, PostgreSQL, Prisma, JWT (access+refresh), Docker.

---

## 1) Rol y objetivo
Actúa como un **equipo senior full‑stack (Angular + PrimeNG + NestJS + PostgreSQL)** y construye un **MVP** de una app web responsive para **registrar operaciones de trading** y analizar métricas de rendimiento enfocadas en **cuentas de fondeo de CFDs**.

### Objetivo del MVP
Crear una aplicación **multiusuario** (aunque inicialmente sea para uso personal) que permita:
- Registrar operaciones (manual).
- Gestionar múltiples cuentas (prop/fondeo).
- Ver dashboard con métricas clave (PnL, win rate, profit factor, drawdown, retorno, etc.).
- Consultar histórico con filtros.
- Exportar datos.
- Dejar preparada la base para una fase 2 de importación/integración con MetaTrader (solo stub en MVP).

---

## 2) Stack y restricciones
- **Frontend:** Angular (última estable), RxJS, **PrimeNG** (componentes y layout).
- **Backend:** NestJS (última estable), REST API, Swagger/OpenAPI.
- **DB:** PostgreSQL.
- **ORM:** **Prisma** (migraciones limpias, DX y tipado fuerte).
- **Auth:** JWT con refresh token.
- **Deploy ready:** Docker (docker-compose para API + DB).
- No incluir integración MetaTrader en MVP, solo **diseñar el módulo/import** (stub).

---

## 3) Modelo de datos (entidades mínimas)
Definir esquema SQL/ORM con estas entidades mínimas:

### User
- id, email (unique), passwordHash, createdAt

### Account
- id, userId (FK)
- name (ej. “Prop 10k”), broker (string), currency (EUR/USD)
- initialBalance (decimal)
- dailyLossLimit (decimal, nullable)
- maxLossLimit (decimal, nullable)
- profitTarget (decimal, nullable)
- startedAt, status (active/archived)
- createdAt
- deletedAt (soft delete)

### Trade
- id, accountId (FK), userId (FK redundante para seguridad)
- instrument (string: “EURUSD”, “NAS100”, etc.)
- side (LONG/SHORT)
- openAt, closeAt (timestamp)
- entryPrice, exitPrice (decimal, nullable)
- quantity (decimal)
- fees (decimal default 0)
- pnlGross (decimal, opcional)
- pnlNet (decimal) // pnlGross - fees (si pnlGross existe)
- riskAmount (decimal, nullable) // € arriesgados
- resultR (decimal, nullable) // pnlNet / riskAmount
- tags (string[] MVP)
- notes (text)
- createdAt
- deletedAt (soft delete)

> TradeAttachment: fuera del MVP. Documentar como fase 2.

---

## 4) Reglas de negocio (cálculos)
Implementar en backend (service) estos KPIs por **Account** y rango de fechas:
- Net PnL (suma pnlNet)
- Win rate (% trades pnlNet > 0)
- Avg win / Avg loss
- Profit factor = sum(wins) / abs(sum(losses))
- Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
- Max drawdown (sobre curva de equity por orden cronológico)
- Daily drawdown (agregado por día)
- Return % = NetPnL / initialBalance
- Series: equity curve (puntos por trade), PnL diario, PnL mensual

Notas:
- Usa **decimales** (no float).
- Todas las consultas deben estar filtradas por **userId** (seguridad).

---

## 5) Endpoints REST (mínimos)
### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Accounts
- GET /accounts
- POST /accounts
- GET /accounts/:id
- PATCH /accounts/:id
- DELETE /accounts/:id (soft delete)

### Trades
- GET /accounts/:id/trades?from=&to=&instrument=&tag=&side=&result=
- POST /accounts/:id/trades
- GET /trades/:tradeId
- PATCH /trades/:tradeId
- DELETE /trades/:tradeId (soft delete)

### Analytics
- GET /accounts/:id/analytics/summary?from=&to=
- GET /accounts/:id/analytics/equity?from=&to=
- GET /accounts/:id/analytics/pnl-daily?from=&to=
- GET /accounts/:id/analytics/pnl-monthly?from=&to=

### Export
- GET /accounts/:id/export/csv?from=&to=

### Import (stub para fase 2)
- POST /accounts/:id/import/metatrader  
  - Responder **501 Not Implemented** + describir el formato esperado (CSV/HTML statement), campos mínimos.

---

## 6) UI Angular (pantallas MVP) usando PrimeNG
1. **Auth**
   - Login / Register (PrimeNG: `p-card`, `p-inputText`, `p-password`, `p-button`, `p-message`)
2. **Accounts**
   - Listado + crear/editar cuenta (PrimeNG: `p-table`, `p-dialog`, `p-toolbar`)
   - Detalle cuenta (PrimeNG: `p-tabView`):
     - Dashboard
     - Trades
     - Configuración
3. **Dashboard**
   - KPIs en cards (PrimeNG `p-card`)
   - Equity curve (línea) (Chart.js)
   - PnL diario (barras)
4. **Trades**
   - Tabla con filtros (rango fecha, instrumento, side, resultado) (`p-table` + filtros + `p-calendar`)
   - CRUD trade (modal `p-dialog` o ruta `/trade/:id`)
5. **Export**
   - Botón export CSV (`p-button`)

> Charts: usar Chart.js (por ejemplo con wrapper Angular). Evitar sobre-ingeniería (sin NgRx en MVP).

---

## 7) Requisitos no funcionales
- Validación DTO (class-validator) + pipes en Nest.
- Manejo de errores consistente (error codes + mensajes).
- Swagger completo (auth, schemas, ejemplos).
- Pruebas mínimas:
  - Unit tests para cálculos de drawdown/profit factor/expectancy.
  - e2e smoke test para auth + crear cuenta + crear trade.
- Seguridad:
  - Hashing (bcrypt o argon2).
  - Rate limit en auth.
  - CORS configurado.

---

## 8) Entregables
- **Monorepo** (Nx recomendado).
- Docker-compose (api + postgres).
- Migraciones DB (Prisma).
- Seed opcional con 1 usuario + 1 cuenta + trades demo.
- README: setup local, comandos, estructura, decisiones, roadmap fase 2.

---

## 9) Backlog (orden de implementación)
1) Auth + Users  
2) Accounts CRUD  
3) Trades CRUD + filtros  
4) Analytics summary + equity + pnl daily/monthly  
5) Dashboard Angular (PrimeNG + charts)  
6) Export CSV  
7) Import stub + documentación formato MT4/MT5 (sin implementar)

---

## 10) Criterios de aceptación (MVP)
- Puedo crear cuenta con balance inicial y límites.
- Puedo crear/editar/borrar trades.
- Veo métricas correctas en dashboard (contrastadas con seed).
- Export CSV funciona y respeta filtros.
- API documentada con Swagger.
- Todo corre con `docker-compose up`.

---

# Apéndice A — Estructura recomendada (monorepo) con Nx

## Estructura
```
/apps
  /web            # Angular + PrimeNG
  /api            # NestJS
/libs
  /shared-types   # interfaces/DTO types compartidos (sin lógica)
/docker
  docker-compose.yml
  Dockerfile.api
```

---

# Apéndice B — Backend NestJS (estructura mínima)
```
apps/api/src
  /modules
    /auth
      auth.controller.ts
      auth.service.ts
      jwt.strategy.ts
      dto/
    /users
      users.service.ts
      users.module.ts
    /accounts
      accounts.controller.ts
      accounts.service.ts
      accounts.module.ts
      dto/
    /trades
      trades.controller.ts
      trades.service.ts
      trades.module.ts
      dto/
    /analytics
      analytics.controller.ts
      analytics.service.ts
      analytics.module.ts
  /common
    /guards
    /decorators
    /filters
    /pipes
    /utils
  prisma/
  main.ts
```

---

# Apéndice C — Prisma schema (MVP)
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  accounts     Account[]
  trades       Trade[]
}

model Account {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])

  name           String
  broker         String?
  currency       String   @default("USD")
  initialBalance Decimal  @db.Decimal(18,2)

  dailyLossLimit Decimal? @db.Decimal(18,2)
  maxLossLimit   Decimal? @db.Decimal(18,2)
  profitTarget   Decimal? @db.Decimal(18,2)

  startedAt      DateTime?
  status         String   @default("active") // active|archived
  createdAt      DateTime @default(now())
  deletedAt      DateTime?

  trades         Trade[]
}

model Trade {
  id         String   @id @default(uuid())
  userId     String
  accountId  String

  user       User     @relation(fields: [userId], references: [id])
  account    Account  @relation(fields: [accountId], references: [id])

  instrument String
  side       String   // LONG|SHORT

  openAt     DateTime
  closeAt    DateTime?

  entryPrice Decimal? @db.Decimal(18,6)
  exitPrice  Decimal? @db.Decimal(18,6)

  quantity   Decimal  @db.Decimal(18,6)
  fees       Decimal  @default(0) @db.Decimal(18,2)

  pnlGross   Decimal? @db.Decimal(18,2)
  pnlNet     Decimal  @db.Decimal(18,2)

  riskAmount Decimal? @db.Decimal(18,2)
  resultR    Decimal? @db.Decimal(18,4)

  notes      String?
  tags       String[] // MVP, luego normalizar

  createdAt  DateTime @default(now())
  deletedAt  DateTime?

  @@index([accountId, openAt])
  @@index([userId, openAt])
}
```

---

# Apéndice D — DTOs NestJS (MVP)

## Auth
```ts
// register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

```ts
// login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
```

## Accounts
```ts
// create-account.dto.ts
import { IsDecimal, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateAccountDto {
  @IsString() name: string;
  @IsOptional() @IsString() broker?: string;

  @IsString() currency: string;

  @IsDecimal() initialBalance: string;

  @IsOptional() @IsDecimal() dailyLossLimit?: string;
  @IsOptional() @IsDecimal() maxLossLimit?: string;
  @IsOptional() @IsDecimal() profitTarget?: string;

  @IsOptional() @IsIn(['active', 'archived']) status?: 'active' | 'archived';
}
```

```ts
// update-account.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
```

## Trades
```ts
// create-trade.dto.ts
import {
  IsDateString, IsDecimal, IsIn, IsOptional, IsString, IsArray,
} from 'class-validator';

export class CreateTradeDto {
  @IsString() instrument: string;
  @IsIn(['LONG', 'SHORT']) side: 'LONG' | 'SHORT';

  @IsDateString() openAt: string;
  @IsOptional() @IsDateString() closeAt?: string;

  @IsOptional() @IsDecimal() entryPrice?: string;
  @IsOptional() @IsDecimal() exitPrice?: string;

  @IsDecimal() quantity: string;

  @IsOptional() @IsDecimal() fees?: string;

  @IsOptional() @IsDecimal() pnlGross?: string;
  @IsDecimal() pnlNet: string;

  @IsOptional() @IsDecimal() riskAmount?: string;
  @IsOptional() @IsDecimal() resultR?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() tags?: string[];
}
```

```ts
// update-trade.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTradeDto } from './create-trade.dto';

export class UpdateTradeDto extends PartialType(CreateTradeDto) {}
```

---

# Apéndice E — Frontend Angular (estructura mínima + PrimeNG)
```
apps/web/src/app
  /core
    auth/
    guards/
    interceptors/
    services/
  /shared
    components/
    pipes/
    ui/
  /features
    /accounts
      pages/
      components/
      accounts.routes.ts
    /trades
      pages/
      components/
      trades.routes.ts
      trade.routes.ts
    /dashboard
      pages/
  app.routes.ts
```

PrimeNG recomendado:
- Tabla y filtros: `p-table`, `p-columnFilter`, `p-multiSelect`
- Fechas: `p-calendar`
- Modales: `p-dialog`
- Tabs: `p-tabView`
- Notificaciones: `p-toast`
- Confirmaciones: `p-confirmDialog`
- Layout: `p-toolbar`, `p-card`

---

# Apéndice F — Shared types (opcional)
```ts
export interface Account {
  id: string;
  name: string;
  currency: string;
  initialBalance: string;
  dailyLossLimit?: string;
  maxLossLimit?: string;
  profitTarget?: string;
  status: 'active' | 'archived';
}
```

---

# Apéndice G — Docker-compose mínimo
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: trading_journal
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/trading_journal
      JWT_ACCESS_SECRET: change_me
      JWT_REFRESH_SECRET: change_me_too
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  pgdata:
```
