import { useCallback, useEffect, useRef } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import type { ProductWithCategory } from "@/lib/types";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validations";
import { throwApiError } from "@/lib/http";

export function useProductsQuery() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const selectedCategoryId = useUIStore((s) => s.selectedCategoryId);
  const sortBy = useUIStore((s) => s.sortBy);
  const sortOrder = useUIStore((s) => s.sortOrder);

  return useQuery({
    queryKey: ["products", { searchQuery, selectedCategoryId, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) await throwApiError(res, "Error al cargar los productos");
      return res.json() as Promise<ProductWithCategory[]>;
    },
    // Al cambiar filtros/orden, mantenemos los datos previos visibles
    // mientras llega la nueva lista (sin flash de skeleton).
    placeholderData: keepPreviousData,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) await throwApiError(res, "Error al crear el producto");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProductInput & { id: string }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) await throwApiError(res, "Error al actualizar el producto");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) await throwApiError(res, "Error al borrar el producto");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

/**
 * Ajuste de stock optimista con debounce.
 *
 * El número sube/baja al instante en caché (UI inmediata) y se envía UN solo
 * PATCH con el valor final ~400ms después del último clic. Así se enmascara la
 * latencia de la BD y se evita el "rebobinado": antes, cada clic disparaba su
 * propio PATCH en paralelo y cada respuesta (más antigua) sobrescribía la caché
 * al volver, repitiendo el recorrido de subida.
 */
const STOCK_FLUSH_MS = 400;

export function useStockAdjuster(product: ProductWithCategory) {
  const queryClient = useQueryClient();
  const targetRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeCache = useCallback(
    (stock: number) => {
      queryClient.setQueriesData<ProductWithCategory[]>({ queryKey: ["products"] }, (old) =>
        old?.map((p) => (p.id === product.id ? { ...p, stock } : p)),
      );
    },
    [queryClient, product.id],
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const target = targetRef.current;
    targetRef.current = null;
    if (target === null) return;

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: target }),
      });
      if (!res.ok) await throwApiError(res, "Error al actualizar el stock");
      const updated = (await res.json()) as ProductWithCategory;
      writeCache(updated.stock);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el stock");
      // Resincronizamos con la verdad del servidor si algo falló.
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  }, [product.id, queryClient, writeCache]);

  const adjust = useCallback(
    (delta: number) => {
      const base = targetRef.current ?? product.stock;
      const next = Math.max(0, base + delta);
      if (next === base) return;
      targetRef.current = next;
      writeCache(next); // UI instantánea
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), STOCK_FLUSH_MS);
    },
    [product.stock, writeCache, flush],
  );

  // Si el componente se desmonta con un cambio pendiente, lo persistimos.
  useEffect(() => {
    return () => {
      if (targetRef.current !== null) void flush();
    };
  }, [flush]);

  return { adjust };
}
