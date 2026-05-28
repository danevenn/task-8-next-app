"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore, type SortField, type SortOrder } from "@/stores/ui-store";

const FIELD_LABELS: Record<SortField, string> = {
  createdAt: "Fecha",
  name: "Nombre",
  price: "Precio",
  stock: "Stock",
};

const ORDER_LABELS: Record<SortOrder, string> = {
  desc: "Descendente",
  asc: "Ascendente",
};

export function SortControls() {
  const sortBy = useUIStore((s) => s.sortBy);
  const sortOrder = useUIStore((s) => s.sortOrder);
  const setSortBy = useUIStore((s) => s.setSortBy);
  const setSortOrder = useUIStore((s) => s.setSortOrder);

  return (
    <div className="flex gap-2">
      <Select
        items={FIELD_LABELS}
        value={sortBy}
        onValueChange={(v) => setSortBy(v as SortField)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Ordenar por">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(FIELD_LABELS) as SortField[]).map((f) => (
            <SelectItem key={f} value={f}>
              {FIELD_LABELS[f]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={ORDER_LABELS}
        value={sortOrder}
        onValueChange={(v) => setSortOrder(v as SortOrder)}
      >
        <SelectTrigger className="w-[150px]" aria-label="Orden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ORDER_LABELS) as SortOrder[]).map((o) => (
            <SelectItem key={o} value={o}>
              {ORDER_LABELS[o]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
