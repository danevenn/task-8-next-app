# Sistema de Inventario

Aplicación full-stack para gestionar productos y categorías, construida con **Next.js (App Router)**, **Prisma**, **PostgreSQL/Neon**, **Zustand** (estado de UI) y **TanStack Query** (estado del servidor).

## Stack

- **Next.js 16** (App Router) — frontend + API Routes en un solo proyecto.
- **React 19** + **shadcn/ui** (base-ui) + **Tailwind CSS v4**.
- **Prisma 6** + **PostgreSQL** (Neon).
- **Zustand** — filtros, búsqueda y estado de la barra lateral.
- **TanStack Query** — caché de datos del servidor y actualización optimista de stock.
- **zod v4** — validación en las API Routes y los formularios.
- Gestor de paquetes: **pnpm**.

## Funcionalidad

- CRUD de **productos** y **categorías**.
- **Filtros** por categoría, **búsqueda** con debounce y **ordenación** (nombre, precio, stock, fecha).
- Ajuste de **stock** con `+`/`−` mediante **actualización optimista con rollback**.
- Layout con barra lateral colapsable (fija en escritorio, `Sheet` en móvil).

## Puesta en marcha

```bash
pnpm install                 # instala dependencias (ejecuta prisma generate)
cp .env.example .env.local   # rellena DATABASE_URL y DIRECT_URL de Neon
pnpm db:migrate              # aplica la migración inicial
pnpm db:seed                 # carga datos de ejemplo (3 categorías, 10 productos)
pnpm dev                     # http://localhost:3000
```

### Variables de entorno (Neon)

- `DATABASE_URL` — cadena **pooled** (host con `-pooler`). La usa Next.js en runtime.
- `DIRECT_URL` — cadena **directa** (sin `-pooler`). La usan las migraciones de Prisma.

`prisma.config.ts` carga `.env.local` para que el CLI de Prisma vea las mismas variables que Next.js.

## Scripts

| Script | Acción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y arranque de producción |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:deploy` | `prisma migrate deploy` (producción) |
| `pnpm db:seed` | Semilla de datos |
| `pnpm db:studio` | Prisma Studio |

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md) — capas del sistema, por qué App Router en vez de Express, modelo de datos, `Decimal` vs `Float`, `DATABASE_URL` vs `DIRECT_URL`.
- [`docs/api.md`](docs/api.md) — los 6 endpoints y por qué el endpoint de stock está separado.
- [`docs/state-management.md`](docs/state-management.md) — estado de servidor vs UI, `persist`, `staleTime` vs `gcTime` y demostraciones.
