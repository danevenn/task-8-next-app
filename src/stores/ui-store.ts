import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SortField = "name" | "price" | "stock" | "createdAt";
export type SortOrder = "asc" | "desc";

interface UIState {
  searchQuery: string;
  selectedCategoryId: string | null;
  sortBy: SortField;
  sortOrder: SortOrder;
  sidebarOpen: boolean;

  setSearchQuery: (q: string) => void;
  selectCategory: (id: string | null) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSidebar: () => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      searchQuery: "",
      selectedCategoryId: null,
      sortBy: "createdAt",
      sortOrder: "desc",
      sidebarOpen: true,

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      selectCategory: (selectedCategoryId) => set({ selectedCategoryId }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      resetFilters: () =>
        set({ searchQuery: "", selectedCategoryId: null, sortBy: "createdAt", sortOrder: "desc" }),
    }),
    {
      name: "inventory-ui",
      // Solo persistimos preferencias de UI duraderas (sidebar), no filtros efímeros.
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    },
  ),
);
