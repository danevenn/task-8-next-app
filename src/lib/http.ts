// Lanza un Error con el mensaje que devuelve la API ({ error: "..." }),
// o un fallback si la respuesta no trae cuerpo JSON.
export async function throwApiError(res: Response, fallback: string): Promise<never> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  throw new Error(data?.error ?? fallback);
}
