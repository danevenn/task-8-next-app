"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";

export function CategoriesView() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Organiza los productos del inventario por categoría.
          </p>
        </div>
        <CategoryForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Nueva categoría
            </Button>
          }
        />
      </div>

      <CategoryList />
    </div>
  );
}
