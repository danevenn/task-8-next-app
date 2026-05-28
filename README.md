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

## Estructura

```
src/
├── app/
│   ├── layout.tsx              # Providers + AppShell + Toaster (sonner)
│   ├── page.tsx                # Redirige a /products
│   ├── providers.tsx           # QueryClientProvider + React Query Devtools
│   ├── globals.css             # Tokens shadcn (base slate + primario azul propio)
│   ├── products/page.tsx       # Página de productos
│   ├── categories/page.tsx     # Página de categorías
│   └── api/
│       ├── categories/route.ts            # GET (lista), POST (crea)
│       ├── categories/[id]/route.ts       # PATCH, DELETE (409 si tiene productos)
│       ├── products/route.ts              # GET (search/filtro/orden), POST
│       ├── products/[id]/route.ts         # PATCH, DELETE
│       └── products/[id]/stock/route.ts   # PATCH solo stock
├── components/
│   ├── ui/                     # Primitivos shadcn/ui (base-ui)
│   ├── app-shell.tsx           # Layout: sidebar colapsable + Sheet en móvil
│   ├── sidebar-nav.tsx         # Navegación Productos / Categorías
│   ├── products-view.tsx       # Vista de productos (toolbar + lista)
│   ├── product-list.tsx        # Grid con estados loading / error / vacío
│   ├── product-card.tsx        # Tarjeta: precio, stock ±, editar, borrar
│   ├── product-form.tsx        # Diálogo crear/editar (react-hook-form)
│   ├── search-bar.tsx          # Búsqueda con debounce de 300ms
│   ├── sort-controls.tsx       # Orden: campo + dirección
│   ├── category-filter.tsx     # Filtro por categoría
│   ├── categories-view.tsx     # Vista de categorías
│   ├── category-list.tsx       # Tabla de categorías
│   └── category-form.tsx       # Diálogo crear/editar categoría
├── hooks/
│   ├── use-products.ts         # Query + mutaciones (stock optimista + rollback)
│   └── use-categories.ts       # Query + mutaciones de categorías
├── stores/
│   └── ui-store.ts             # Zustand: búsqueda, filtro, orden, sidebar (persist)
└── lib/
    ├── db.ts                   # Singleton de PrismaClient
    ├── query-client.ts         # QueryClient (staleTime / gcTime)
    ├── validations.ts          # Esquemas zod (API + formularios)
    ├── api.ts                  # Helper de respuesta de error de validación
    ├── http.ts                 # throwApiError (fetch en cliente)
    ├── types.ts                # Tipos cliente (price y fechas como string)
    ├── format.ts               # formatPrice (Intl, EUR)
    ├── zod-resolver.ts         # Puente de tipos zod 4 ↔ react-hook-form
    └── utils.ts                # cn() (clsx + tailwind-merge)

prisma/
├── schema.prisma               # Modelos Category y Product
├── seed.ts                     # Semilla: 3 categorías + 10 productos
└── migrations/                 # Migración inicial (init)

docs/
├── arquitectura.md             # Capas, App Router vs Express, Decimal, Neon
├── api.md                      # Los 6 endpoints + por qué el stock va aparte
└── state-management.md         # Servidor vs UI, persist, staleTime/gcTime

prisma.config.ts                # Carga .env.local + config de seed (Prisma 6)
components.json                 # Configuración de shadcn/ui
pnpm-workspace.yaml             # allowBuilds (build scripts permitidos)
.env.example                    # Plantilla de variables (DATABASE_URL, DIRECT_URL)
```

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
