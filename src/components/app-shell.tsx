"use client";

import { useState } from "react";
import { Boxes, Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUIStore } from "@/stores/ui-store";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "hidden flex-col border-r bg-card transition-[width] duration-200 md:flex",
          sidebarOpen ? "w-60" : "w-16",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Boxes className="size-5 shrink-0 text-primary" />
          {sidebarOpen && <span className="font-semibold">Inventario</span>}
        </div>
        <div className="flex-1 p-2">
          <SidebarNav collapsed={!sidebarOpen} />
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", sidebarOpen ? "justify-start" : "justify-center")}
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Colapsar barra lateral" : "Expandir barra lateral"}
          >
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="size-4" />
                <span>Colapsar</span>
              </>
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Abrir menú">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="h-14 flex-row items-center gap-2 border-b px-4">
                <Boxes className="size-5 text-primary" />
                <SheetTitle>Inventario</SheetTitle>
              </SheetHeader>
              <div className="p-2">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Inventario</span>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
