"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useCategoriesQuery } from "@/hooks/use-categories";

export function CategoryFilter() {
  const selected = useUIStore((s) => s.selectedCategoryId);
  const selectCategory = useUIStore((s) => s.selectCategory);
  const { data: categories } = useCategoriesQuery();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? "default" : "outline"}
        size="sm"
        onClick={() => selectCategory(null)}
      >
        Todas
      </Button>
      {categories?.map((c) => (
        <Button
          key={c.id}
          variant={selected === c.id ? "default" : "outline"}
          size="sm"
          onClick={() => selectCategory(c.id)}
        >
          {c.name}
        </Button>
      ))}
    </div>
  );
}
