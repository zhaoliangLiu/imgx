export function redactSecret(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

export function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer ****")
    .replace(/sk-[A-Za-z0-9._-]+/g, (match) => redactSecret(match) ?? "****")
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "data:image/*;base64,****");
}

