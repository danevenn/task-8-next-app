"use client";

import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { SearchBar } from "./search-bar";
import { SortControls } from "./sort-controls";
import { CategoryFilter } from "./category-filter";
import { ProductList } from "./product-list";
import { ProductForm } from "./product-form";

export function ProductsView() {
  const resetFilters = useUIStore((s) => s.resetFilters);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">Inventario de productos por categoría.</p>
        </div>
        <ProductForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Nuevo producto
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar />
          <SortControls />
          <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="size-4" />
            Limpiar filtros
          </Button>
        </div>
        <CategoryFilter />
      </div>

      <ProductList />
    </div>
  );
}
