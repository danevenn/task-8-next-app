import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createCategorySchema } from "@/lib/validations";
import { validationError } from "@/lib/api";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createCategorySchema.safeParse(body);

  if (!result.success) return validationError(result.error);

  try {
    const category = await db.category.create({ data: result.data });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 },
      );
    }
    throw error;
  }
}
