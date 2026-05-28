import { NextResponse } from "next/server";
import { z } from "zod";

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Datos inválidos", details: z.flattenError(error).fieldErrors },
    { status: 400 },
  );
}
