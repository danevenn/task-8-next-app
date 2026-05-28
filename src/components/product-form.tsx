"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productFormSchema, type ProductFormValues } from "@/lib/validations";
import { zodFormResolver } from "@/lib/zod-resolver";
import { useCategoriesQuery } from "@/hooks/use-categories";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/hooks/use-products";
import type { ProductWithCategory } from "@/lib/types";

export function ProductForm({
  product,
  trigger,
}: {
  product?: ProductWithCategory;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(product);

  const { data: categories } = useCategoriesQuery();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodFormResolver<ProductFormValues>(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      categoryId: "",
    },
  });

  // Rellenamos / reseteamos el formulario al abrir.
  useEffect(() => {
    if (!open) return;
    reset({
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product ? Number(product.price) : 0,
      stock: product?.stock ?? 0,
      categoryId: product?.categoryId ?? "",
    });
  }, [open, product, reset]);

  const categoryItems = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.name]),
  );

  async function onSubmit(values: ProductFormValues) {
    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, ...values });
        toast.success("Producto actualizado");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Producto creado");
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
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del producto."
              : "Rellena los datos para crear un producto."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Precio (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select items={categoryItems} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
