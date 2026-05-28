import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations";
import { validationError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = updateProductSchema.safeParse(body);

  if (!result.success) return validationError(result.error);

  try {
    const product = await db.product.update({
      where: { id },
      data: result.data,
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "La categoría indicada no existe" }, { status: 400 });
      }
    }
    throw error;
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await db.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    throw error;
  }
}
