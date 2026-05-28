import { z } from "zod";

export const SORT_FIELDS = ["name", "price", "stock", "createdAt"] as const;
export const SORT_ORDERS = ["asc", "desc"] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  categoryId: z.cuid("El ID de categoría no es válido"),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(100),
    description: z.string().nullable(),
    price: z.number().positive("El precio debe ser positivo"),
    stock: z.number().int().min(0, "El stock no puede ser negativo"),
    categoryId: z.cuid("El ID de categoría no es válido"),
  })
  .partial();

export const updateStockSchema = z.object({
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
});

// Schema del formulario (sin .default) para un tipado limpio con react-hook-form.
export const productFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(500).optional(),
  price: z.number({ error: "Introduce un precio" }).positive("El precio debe ser positivo"),
  stock: z.number({ error: "Introduce un stock" }).int().min(0, "El stock no puede ser negativo"),
  categoryId: z.cuid("Selecciona una categoría"),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  description: z.string().optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(60),
    description: z.string().nullable(),
  })
  .partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
