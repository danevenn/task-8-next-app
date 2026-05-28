import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createProductSchema, SORT_FIELDS, SORT_ORDERS } from "@/lib/validations";
import { validationError } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");

  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const sortBy = SORT_FIELDS.includes(sortByParam as (typeof SORT_FIELDS)[number])
    ? (sortByParam as (typeof SORT_FIELDS)[number])
    : "createdAt";
  const sortOrder = SORT_ORDERS.includes(sortOrderParam as (typeof SORT_ORDERS)[number])
    ? (sortOrderParam as (typeof SORT_ORDERS)[number])
    : "desc";

  const products = await db.product.findMany({
    where: {
      name: search ? { contains: search, mode: "insensitive" } : undefined,
      categoryId: categoryId ?? undefined,
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { [sortBy]: sortOrder },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createProductSchema.safeParse(body);

  if (!result.success) return validationError(result.error);

  try {
    const product = await db.product.create({
      data: result.data,
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "La categoría indicada no existe" },
        { status: 400 },
      );
    }
    throw error;
  }
}
