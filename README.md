# Trading Tracker & Journal MVP

App web para registrar operaciones de trading y analizar métricas (cuentas de fondeo CFDs).

## Stack

- **Frontend**: Angular 19+ (PrimeNG v21, Chart.js)
- **Backend**: NestJS (Prisma v6, PostgreSQL)
- **Infrastructure**: Docker, Nx Monorepo

## Requisitos previos

- Node.js 20+
- Docker & Docker Compose

## Setup Local

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Levantar base de datos**

   ```bash
   docker-compose -f docker/docker-compose.yml up -d postgres
   ```

3. **Configurar entorno**
   Crea un archivo `.env` en la raíz (opcional, o usa el default):

   ```
   DATABASE_URL="postgresql://app:app@localhost:5432/trading_journal"
   ```

4. **Inicializar base de datos**

   ```bash
   npx prisma migrate dev --name init --schema apps/api/prisma/schema.prisma
   ```

5. **Iniciar Aplicaciones**

   Backend (API):

   ```bash
   npx nx serve api
   ```

   Frontend (Web):

   ```bash
   npx nx serve web
   ```

## Estructura

- `apps/api`: NestJS Backend
- `apps/web`: Angular Frontend
- `docker`: Configuración Docker
- `libs`: Librerías compartidas (futuro)

## Desarrollo

- **Generar cliente Prisma**: `npx prisma generate --schema apps/api/prisma/schema.prisma`
