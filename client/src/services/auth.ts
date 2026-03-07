/**
 * Returns the current authenticated user's ID.
 * Tries localStorage "user" first, then falls back to decoding the JWT token.
 */
export function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?._id) return parsed._id;
    }
  } catch { /* ignore */ }

  // Fallback: decode user ID from JWT token payload
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?._id ?? null;
    }
  } catch { /* ignore */ }

  return null;
}
