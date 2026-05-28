"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";

export function SearchBar() {
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const [value, setValue] = useState("");

  // Debounce de 300ms: evitamos disparar una query por cada tecla.
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(value), 300);
    return () => clearTimeout(id);
  }, [value, setSearchQuery]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar productos..."
        className="pl-9"
        aria-label="Buscar productos"
      />
    </div>
  );
}
