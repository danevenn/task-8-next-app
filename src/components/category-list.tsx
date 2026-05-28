"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategoriesQuery, useDeleteCategoryMutation } from "@/hooks/use-categories";
import { CategoryForm } from "./category-form";
import type { CategoryWithCount } from "@/lib/types";

function DeleteCategoryButton({ category }: { category: CategoryWithCount }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteCategoryMutation();
  const hasProducts = category._count.products > 0;

  const onDelete = () => {
    deleteMutation.mutate(category.id, {
      onSuccess: () => {
        toast.success("Categoría borrada");
        setOpen(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al borrar"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="icon-sm"
            disabled={hasProducts}
            title={hasProducts ? "No se puede borrar: tiene productos asociados" : "Borrar"}
            aria-label="Borrar categoría"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Borrar categoría</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres borrar “{category.name}”?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button variant="destructive" onClick={onDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Borrando..." : "Borrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryList() {
  const { data: categories, isLoading, isError, error, refetch } = useCategoriesQuery();

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Error al cargar las categorías"}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Aún no hay categorías.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center">Productos</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-muted-foreground">{c.description ?? "—"}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{c._count.products}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <CategoryForm
                    category={c}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Editar categoría">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteCategoryButton category={c} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
