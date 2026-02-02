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
   npm run db:up
   ```

3. **Iniciar Aplicaciones**
   - **Ambos (Recomendado)**: `npm run dev`
   - **Backend solo**: `npm run api:serve`
   - **Frontend solo**: `npm run web:serve`

4. **Inicializar base de datos (Primera vez)**

   ```bash
   npx prisma migrate dev --name init --schema apps/api/prisma/schema.prisma
   ```

## Estructura

- `apps/api`: NestJS Backend
- `apps/web`: Angular Frontend
- `docker`: Configuración Docker
- `libs`: Librerías compartidas (futuro)

## Desarrollo

- **Generar cliente Prisma**: `npx prisma generate --schema apps/api/prisma/schema.prisma`
