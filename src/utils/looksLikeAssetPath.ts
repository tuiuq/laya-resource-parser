export function looksLikeAssetPath(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("http")) return false;
  if (value.startsWith("data:")) return false;
  if (!value.includes("/")) return false;
  if (!value.includes(".")) return false;
  if (
    value.includes("{") ||
    value.includes("}")
  ) return false;
  return true;
}
