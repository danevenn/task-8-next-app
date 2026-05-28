# Gestión de estado: servidor vs UI

Este proyecto separa deliberadamente dos clases de estado. Mezclarlas (todo con `useState` + prop drilling) es el error más común y el que esta tarea busca evitar.

## Estado del servidor vs estado de UI

| | **Estado del servidor** | **Estado de UI** |
|---|---|---|
| Herramienta | TanStack Query | Zustand |
| Dónde | `src/hooks/use-products.ts`, `use-categories.ts` | `src/stores/ui-store.ts` |
| Qué es | Datos que **viven en la base de datos** y la UI solo cachea | Estado **puramente local** del navegador |
| La fuente de la verdad | El servidor (Postgres) | El propio cliente |
| Ejemplos del inventario | La lista de productos, las categorías, el stock de cada producto | El texto del buscador, la categoría seleccionada, el criterio de orden, si la barra lateral está abierta |

La diferencia clave: el **estado del servidor es asíncrono y compartido** — puede cambiarlo otro usuario, puede quedar obsoleto, hay que refetchearlo, cachearlo e invalidarlo. El **estado de UI es síncrono y propio** — nadie más lo cambia, no se "queda obsoleto", no necesita caché ni refetch.

Ejemplo concreto de cómo cooperan: `searchQuery` y `selectedCategoryId` son **estado de UI** (Zustand). El hook `useProductsQuery` los lee y los mete tanto en el `queryKey` como en los query params del fetch:

```ts
queryKey: ["products", { searchQuery, selectedCategoryId, sortBy, sortOrder }]
```

Así, cuando cambia un filtro de UI, cambia el `queryKey` y TanStack Query trata la nueva combinación como otra entrada de caché: refetchea si hace falta y memoriza el resultado por combinación de filtros.

## El middleware `persist` de Zustand

`persist` guarda parte del store en `localStorage` (clave `inventory-ui`) y lo **rehidrata** al recargar la página. Sin él, todo el estado de UI se perdería en cada recarga.

Pero no todo el estado de UI merece persistirse. Por eso usamos `partialize`:

```ts
persist(
  (set) => ({ /* … */ }),
  {
    name: "inventory-ui",
    partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
  }
)
```

- **`sidebarOpen` SÍ se persiste**: es una **preferencia duradera del usuario**. Si colapsó la barra lateral, espera encontrarla colapsada la próxima vez que abra la app. Persistirla mejora la experiencia.
- **`searchQuery` (y los filtros) NO se persisten**: son **estado efímero de una sesión de trabajo**. Sería confuso abrir la app y encontrarse con un buscador prefiltrado por "teclado" de hace tres días, viendo una lista incompleta sin recordar por qué. Lo natural es empezar siempre con la vista completa. Además, persistir el filtro y luego pedir esos datos al servidor mezcla estado de UI con estado de servidor de forma frágil.

Regla general: persiste **preferencias**, no **contexto de trabajo transitorio**.

## `staleTime` vs `gcTime`

Configurados en `src/lib/query-client.ts`:

```ts
queries: {
  staleTime: 1000 * 60 * 2,  // 2 minutos
  gcTime:    1000 * 60 * 10,  // 10 minutos
}
```

Son dos relojes distintos:

- **`staleTime`** — cuánto tiempo un dato se considera **fresco** (`fresh`). Mientras está fresco, TanStack Query **lo sirve desde la caché sin refetchear**, aunque el componente se vuelva a montar o la ventana recupere el foco. Pasados los 2 min, el dato pasa a **`stale`** (obsoleto): se sigue mostrando, pero en el próximo disparo (montaje, foco, invalidación) se refetcheará en segundo plano.
- **`gcTime`** (garbage collection) — cuánto tiempo se **conserva en memoria** una query que **ya no usa ningún componente** (inactiva). Si navegas fuera de Productos, su caché queda inactiva; si vuelves antes de 10 min, los datos siguen ahí (se ven al instante mientras se revalida). Pasados los 10 min sin uso, la entrada se **elimina** de la caché y el siguiente acceso parte de cero (loading).

Resumen: `staleTime` decide **cuándo refetchear** datos que se están usando; `gcTime` decide **cuándo olvidar** datos que ya no se usan.

---

## Demostración 1 — Error del servidor al ajustar stock (optimista + rollback)

`useUpdateStockMutation` hace una **actualización optimista**: pinta el nuevo stock antes de que el servidor responda y revierte si falla.

Flujo (`src/hooks/use-products.ts`):

1. **`onMutate`**: cancela queries de `["products"]` en vuelo, guarda un **snapshot** de la caché y aplica el nuevo stock con `setQueriesData`. La UI se actualiza al instante.
2. **`onError`**: restaura el snapshot → el stock vuelve a su valor anterior (rollback).
3. **`onSettled`**: invalida `["products"]` para reconciliar con el servidor pase lo que pase.

**Cómo demostrarlo** (forzar un 500 temporal en `src/app/api/products/[id]/stock/route.ts`):

```ts
export async function PATCH() {
  return NextResponse.json({ error: "Fallo simulado" }, { status: 500 });
}
```

**Qué se observa en la UI**: al pulsar `+`/`−`, el contador de stock cambia **inmediatamente** (optimista). Décimas de segundo después, al llegar el 500, el contador **vuelve a su valor original** (rollback) y aparece un toast de error ("Error al actualizar el stock"). El usuario nunca ve un estado a medias y los datos quedan consistentes con el servidor. (Recuerda revertir el endpoint tras la prueba.)

## Demostración 2 — Estados en React Query DevTools

Abre el panel de **React Query DevTools** (icono flotante, abajo a la izquierda) y navega entre **Productos** y **Categorías**:

- **`fresh`** (verde): justo tras cargar, la query `["products", …]` está fresca. Durante los primeros 2 min (`staleTime`), navegar fuera y volver **no dispara** refetch: los datos se sirven de caché.
- **`stale`** (amarillo): pasados los 2 min, o tras invalidar (al crear/editar/borrar), la query pasa a obsoleta. Sigue mostrándose, pero el próximo montaje/foco la refetcheará.
- **`fetching`** (azul): mientras hay una petición en curso (carga inicial, refetch en background, o el `invalidateQueries` de `onSettled` tras ajustar stock) el indicador muestra actividad. Si los datos ya estaban en caché, se siguen viendo mientras el `fetching` ocurre en segundo plano.

También se aprecia el conteo de **observers**: al salir de la página de Productos, la query queda con 0 observers (inactiva) y empieza a contar su `gcTime` (10 min) antes de ser recolectada.
