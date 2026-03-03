/**
 * Shared API configuration for the Chess Tournament app.
 * Use VITE_API_BASE in .env to override (e.g. VITE_API_BASE=http://localhost:8080/ctms)
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";

/**
 * Resolve avatar/image URL - handles relative paths with correct API origin.
 * @param {string} src - Path (e.g. /uploads/avatars/xxx.jpg) or full URL
 * @returns {string} Full URL
 */
export function resolveAssetUrl(src) {
  if (!src || typeof src !== "string") return "";
  const s = src.trim();
  if (!s) return "";
  if (/^(https?:)?\/\//i.test(s)) return s.startsWith("//") ? `${window.location.protocol}${s}` : s;
  if (/^(data:|blob:)/i.test(s)) return s;
  try {
    const origin = new URL(API_BASE).origin;
    return s.startsWith("/") ? `${origin}${s}` : `${origin}/${s.replace(/^\.?\//, "")}`;
  } catch {
    return `${window.location.origin}${s.startsWith("/") ? s : `/${s}`}`;
  }
}
