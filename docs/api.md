# API REST del inventario

Todos los endpoints viven en `src/app/api`. La validación de entrada se hace con **zod** (`src/lib/validations.ts`) y la persistencia con **Prisma** (`src/lib/db.ts`). Las respuestas de error tienen la forma `{ "error": "mensaje" }`; los errores de validación añaden `{ "details": { campo: [mensajes] } }`.

Convención de tipos: `price` se devuelve como **string** (Prisma `Decimal` serializado), `createdAt`/`updatedAt` como **string** ISO‑8601.

---

## Categorías

### `GET /api/categories`
Lista todas las categorías, ordenadas por nombre, con el número de productos.

- **Respuesta 200**:
  ```json
  [
    { "id": "clx…", "name": "Electrónica", "description": "…",
      "createdAt": "2026-05-28T…", "_count": { "products": 4 } }
  ]
  ```

### `POST /api/categories`
Crea una categoría.

- **Body**: `{ "name": string (1–60), "description"?: string }`
- **201**: la categoría creada.
- **400**: `Datos inválidos` (+ `details`) si el `name` falta o excede 60.
- **409**: `Ya existe una categoría con ese nombre` (índice único, error Prisma `P2002`).

### `PATCH /api/categories/[id]`
Edita nombre y/o descripción.

- **Body** (parcial): `{ "name"?: string, "description"?: string | null }`
- **200**: la categoría actualizada.
- **400**: `Datos inválidos`.
- **404**: `Categoría no encontrada` (Prisma `P2025`).
- **409**: `Ya existe una categoría con ese nombre`.

### `DELETE /api/categories/[id]`
Borra una categoría **solo si no tiene productos**.

- **204**: borrada (sin cuerpo).
- **409**: `No se puede borrar: la categoría tiene N producto(s) asociado(s)`. Se comprueba con `db.product.count` antes de borrar; además la FK usa `onDelete: Restrict`.
- **404**: `Categoría no encontrada`.

---

## Productos

### `GET /api/products`
Lista productos con filtros. Incluye `category: { id, name }`.

- **Query params**:
  - `search` — filtra por nombre (`contains`, *case-insensitive*).
  - `categoryId` — filtra por categoría.
  - `sortBy` — `name | price | stock | createdAt` (por defecto `createdAt`; cualquier otro valor se ignora).
  - `sortOrder` — `asc | desc` (por defecto `desc`).
- **200**: array de productos.

### `POST /api/products`
Crea un producto.

- **Body**: `{ "name": string (1–100), "description"?: string, "price": number > 0, "stock"?: int ≥ 0 (def. 0), "categoryId": cuid }`
- **201**: el producto creado (con su categoría).
- **400**: `Datos inválidos` (+ `details`), o `La categoría indicada no existe` (FK inválida, Prisma `P2003`).

### `PATCH /api/products/[id]`
Edita cualquier campo del producto.

- **Body** (parcial): cualquier subconjunto de `name`, `description`, `price`, `stock`, `categoryId`.
- **200**: el producto actualizado.
- **400**: `Datos inválidos` o `La categoría indicada no existe`.
- **404**: `Producto no encontrado`.

### `DELETE /api/products/[id]`
- **204**: borrado.
- **404**: `Producto no encontrado`.

### `PATCH /api/products/[id]/stock`
Actualiza **solo** el stock.

- **Body**: `{ "stock": int ≥ 0 }`
- **200**: el producto actualizado.
- **400**: `Datos inválidos` si `stock` es negativo o no entero.
- **404**: `Producto no encontrado`.

---

## ¿Por qué un endpoint de stock separado del de edición general?

`PATCH /api/products/[id]/stock` existe aparte de `PATCH /api/products/[id]`. Desde el **principio de responsabilidad única**, cada endpoint tiene una sola razón para cambiar:

1. **Responsabilidad única y validación acotada**: el endpoint de stock solo conoce y valida un campo (`{ stock }`). Su esquema zod es mínimo y no puede tocar precio, nombre ni categoría por accidente. El endpoint general valida el producto completo.

2. **Operación de dominio explícita**: "ajustar inventario" es una acción de negocio distinta de "editar la ficha del producto". Tener una ruta dedicada hace que la intención sea legible en el código y en los logs (`PATCH …/stock` vs `PATCH …`).

3. **Seguridad / superficie mínima**: en un sistema real, un operario de almacén podría tener permiso para mover stock pero no para cambiar precios. Endpoints separados permiten autorizar cada acción por separado (least privilege). Con un único PATCH habría que filtrar campos dentro del handler.

4. **Encaja con la actualización optimista**: el cliente ajusta stock con `+`/`−` muy a menudo y quiere feedback inmediato. Un endpoint pequeño y predecible (entra `{stock}`, sale el producto) es ideal para la mutación optimista de TanStack Query (`useUpdateStockMutation`), sin arrastrar el resto de campos en cada `+1`.

5. **Payloads más ligeros**: ajustar stock no obliga a reenviar todo el producto.
