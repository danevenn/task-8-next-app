"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/hooks/use-categories";
import type { CategoryWithCount } from "@/lib/types";

export function CategoryForm({
  category,
  trigger,
}: {
  category?: CategoryWithCount;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(category);

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodFormResolver<CreateCategoryInput>(createCategorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: category?.name ?? "", description: category?.description ?? "" });
  }, [open, category, reset]);

  async function onSubmit(values: CreateCategoryInput) {
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, ...values });
        toast.success("Categoría actualizada");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Categoría creada");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos de la categoría." : "Crea una nueva categoría."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input id="cat-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Descripción</Label>
            <Input id="cat-desc" {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
