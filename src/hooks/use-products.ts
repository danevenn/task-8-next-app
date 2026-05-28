import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

export function useUpdateStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, stock }: { productId: string; stock: number }) => {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      if (!res.ok) await throwApiError(res, "Error al actualizar el stock");
      return res.json() as Promise<ProductWithCategory>;
    },
    // Actualización optimista: pintamos el nuevo stock antes de la respuesta del servidor.
    onMutate: async ({ productId, stock }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = queryClient.getQueriesData<ProductWithCategory[]>({ queryKey: ["products"] });
      queryClient.setQueriesData<ProductWithCategory[]>({ queryKey: ["products"] }, (old) =>
        old?.map((p) => (p.id === productId ? { ...p, stock } : p)),
      );
      return { snapshot };
    },
    // Rollback: restauramos cada caché al valor previo si el servidor falla.
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    // Sin invalidar: escribimos la respuesta del servidor EN SU SITIO (sin refetch
    // ni reordenar). El producto mantiene su posición y el cambio es instantáneo.
    onSuccess: (updated) => {
      queryClient.setQueriesData<ProductWithCategory[]>({ queryKey: ["products"] }, (old) =>
        old?.map((p) => (p.id === updated.id ? updated : p)),
      );
    },
  });
}
