import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { updateCategorySchema } from "@/lib/validations";
import { validationError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = updateCategorySchema.safeParse(body);

  if (!result.success) return validationError(result.error);

  try {
    const category = await db.category.update({ where: { id }, data: result.data });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Ya existe una categoría con ese nombre" },
          { status: 409 },
        );
      }
    }
    throw error;
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: la categoría tiene ${productCount} producto(s) asociado(s)` },
      { status: 409 },
    );
  }

  try {
    await db.category.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }
    throw error;
  }
}
