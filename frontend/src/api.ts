export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data as T;
}
export async function pdfRequest(url: string): Promise<Blob> {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error || "Génération impossible.");
  }
  return r.blob();
}
