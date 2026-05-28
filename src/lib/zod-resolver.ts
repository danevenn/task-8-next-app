import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

// Puente de tipos: @hookform/resolvers 5.4 aún no tipa zod 4.4
// (desajuste en el campo interno `version.minor`). En runtime funciona;
// aislamos aquí el cast para no repetirlo en cada formulario.
export function zodFormResolver<T extends FieldValues>(schema: ZodType): Resolver<T> {
  return zodResolver(schema as never) as Resolver<T>;
}
