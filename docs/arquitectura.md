# Arquitectura del sistema de inventario

## Visión general: tres capas

```
┌──────────────────────────────────────────────────────────────────┐
│ NAVEGADOR (React 19 — Client Components)                           │
│                                                                    │
│  ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │ Estado de UI (Zustand)   │   │ Estado del servidor          │  │
│  │ ui-store.ts              │   │ (TanStack Query)             │  │
│  │  · searchQuery           │   │  · products  (use-products)  │  │
│  │  · selectedCategoryId    │   │  · categories(use-categories)│  │
│  │  · sortBy / sortOrder    │   │                              │  │
│  │  · sidebarOpen (persist) │   │  caché, refetch, optimistic  │  │
│  └──────────────────────────┘   └──────────────────────────────┘  │
│            │                               │ fetch() /api/*         │
└────────────┼───────────────────────────────┼──────────────────────┘
             │                               │
┌────────────┼───────────────────────────────┼──────────────────────┐
│ SERVIDOR (Next.js App Router)               ▼                      │
│                                                                    │
│  ┌────────────────────────────┐   ┌────────────────────────────┐  │
│  │ API Routes (src/app/api/*) │   │ Server Components           │  │
│  │  route.ts por endpoint     │   │ (layout.tsx, page.tsx)      │  │
│  │  GET/POST/PATCH/DELETE      │   │ renderizan el shell en SSR  │  │
│  │  validación zod + Prisma   │   │                             │  │
│  └────────────────────────────┘   └────────────────────────────┘  │
│            │ Prisma Client (src/lib/db.ts)                          │
└────────────┼───────────────────────────────────────────────────────┘
             │ SQL
┌────────────▼───────────────────────────────────────────────────────┐
│ BASE DE DATOS (PostgreSQL / Neon)                                   │
│                                                                     │
│   categories ──1:N──> products                                      │
│   (id, name, description)   (id, name, price, stock, categoryId…)   │
└─────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React separa dos tipos de estado. El **estado de UI** (qué filtro está activo, si la barra lateral está abierta) vive en un store de Zustand. El **estado del servidor** (la lista de productos y categorías) lo gestiona TanStack Query, que se encarga de la caché, el refetch y las actualizaciones optimistas.
- **Servidor**: las **API Routes** son endpoints REST que ejecutan SQL a través de Prisma. Los **Server Components** renderizan el armazón de las páginas en el servidor.
- **Base de datos**: PostgreSQL alojado en Neon, con dos tablas relacionadas (`categories` 1:N `products`).

## ¿Por qué Next.js (App Router) y no un Express + Vite separados?

Con el **App Router** de Next.js, el servidor y el cliente viven en un único proyecto:

- Las **API Routes** (`src/app/api/**/route.ts`) son el backend. Cada carpeta con un `route.ts` es un endpoint y exporta funciones con el nombre del método HTTP (`GET`, `POST`, `PATCH`, `DELETE`). No hace falta levantar un servidor Express aparte: Next.js ya ejecuta ese código en el servidor.
- Los **Server Components** y los **Client Components** conviven en `src/app`, sin un proyecto de frontend separado con Vite.

Ventajas concretas frente a "Express + Vite" como dos repos/procesos:

1. **Un solo despliegue**: en Vercel se despliega todo junto. No hay que coordinar dos servicios ni configurar CORS entre dominios distintos (el frontend llama a `/api/...` en su mismo origen).
2. **Variables de entorno unificadas**: `DATABASE_URL` se define una vez para todo el proyecto.
3. **Tipos compartidos**: el cliente y el servidor importan los mismos tipos (`@/lib/validations`, `@/lib/types`) sin duplicarlos entre dos paquetes.
4. **Menos configuración**: un único `package.json`, un único build, un único `tsconfig`.

El precio que sí se sigue pagando es la separación lógica: el navegador no toca Prisma ni la base de datos directamente; siempre pasa por `/api/*`.

## Modelo de datos

```prisma
model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  createdAt   DateTime  @default(now())
  products    Product[]
  @@map("categories")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  @@map("products")
}
```

- Relación **1:N**: una categoría tiene muchos productos; cada producto pertenece a una categoría.
- `onDelete: Restrict`: **no se puede borrar una categoría que aún tiene productos**. Por eso el endpoint `DELETE /api/categories/[id]` devuelve `409` si la categoría tiene productos asociados.

### ¿Por qué `price` usa `Decimal` y no `Float`?

`Float` (coma flotante IEEE-754) **no puede representar exactamente** muchos valores decimales. El caso clásico: `0.1 + 0.2 === 0.30000000000000004`. En un sistema de inventario esto provoca errores reales:

- Un producto a `19.99 €` podría almacenarse como `19.989999999…` y, al sumar cientos de líneas en un pedido o un informe, los céntimos se desvían.
- Las comparaciones (`precio === 19.99`) fallan de forma impredecible.
- Los totales y los impuestos calculados sobre `Float` acumulan error de redondeo.

`Decimal(10, 2)` almacena el número en **base 10 con precisión exacta**: hasta 10 dígitos en total y 2 decimales. Es la representación correcta para dinero. El precio que se paga es operativo: Prisma devuelve un objeto `Decimal` (no un `number`), que al serializarse a JSON viaja como **string** — por eso en el cliente (`src/lib/types.ts`) `price` está tipado como `string` y se formatea con `Intl.NumberFormat`.

### `DATABASE_URL` (pooled) vs `DIRECT_URL` (directa) en Neon

Neon ofrece dos cadenas de conexión al mismo Postgres:

| Variable | Host | Uso | Por qué |
|---|---|---|---|
| `DATABASE_URL` | `...-pooler...` | Runtime de Next.js (API Routes) | Pasa por **PgBouncer** (connection pooling). Las funciones serverless arrancan y mueren constantemente; sin pool agotarían el límite de conexiones del Postgres. El pooler reutiliza conexiones. |
| `DIRECT_URL` | sin `-pooler` | Migraciones de Prisma | Las migraciones necesitan una **conexión directa y con sesión completa** (transacciones largas, comandos DDL, advisory locks) que el pooler en modo *transaction* no soporta. |

En `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")  // pooled → consultas de la app
  directUrl = env("DIRECT_URL")    // directa → migrate / db push
}
```

Usar la pooled para migraciones suele fallar o dejar el esquema inconsistente; usar la directa en runtime serverless agota conexiones. Cada una para lo suyo.

> **Nota de configuración del entorno**: Prisma 6 ya no autocarga el `.env` cuando existe `prisma.config.ts`. Este proyecto carga `.env.local` (la convención de Next.js para secretos locales) desde `prisma.config.ts` con `dotenv`, de modo que tanto el runtime de Next como el CLI de Prisma leen las mismas variables. El archivo `.env.local` está en `.gitignore`; `.env.example` documenta las variables sin valores.
