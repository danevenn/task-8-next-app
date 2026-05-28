"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { useDeleteProductMutation, useStockAdjuster } from "@/hooks/use-products";
import { ProductForm } from "./product-form";
import type { ProductWithCategory } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const { adjust } = useStockAdjuster(product);
  const deleteProduct = useDeleteProductMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = () => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success("Producto borrado");
        setConfirmOpen(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al borrar"),
    });
  };

  const outOfStock = product.stock === 0;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{product.name}</h3>
          <Badge variant="secondary">{product.category.name}</Badge>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => adjust(-1)}
            disabled={outOfStock}
            aria-label="Disminuir stock"
          >
            <Minus className="size-3.5" />
          </Button>
          <Badge
            variant={outOfStock ? "destructive" : "outline"}
            className="min-w-14 justify-center tabular-nums"
          >
            <motion.span
              key={product.stock}
              initial={{ scale: 1.4, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              {product.stock}
            </motion.span>
            <span className="ml-1">ud.</span>
          </Badge>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => adjust(1)}
            aria-label="Aumentar stock"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </CardContent>

      <CardFooter className="mt-auto justify-end gap-2">
        <ProductForm
          product={product}
          trigger={
            <Button variant="ghost" size="sm">
              <Pencil className="size-4" />
              Editar
            </Button>
          }
        />
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" aria-label="Borrar producto">
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Borrar producto</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres borrar “{product.name}”? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button variant="destructive" onClick={onDelete} disabled={deleteProduct.isPending}>
                {deleteProduct.isPending ? "Borrando..." : "Borrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
