// Tipos del lado cliente: la API serializa a JSON, por lo que Decimal y DateTime
// llegan como string (no como Prisma.Decimal / Date).

export type ProductWithCategory = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
};

export type CategoryWithCount = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { products: number };
};
