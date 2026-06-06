const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BACKEND_ORIGIN = API.replace(/\/api\/?$/, "");

export function toFileUrl(p) {
  if (!p) return "";

  // If DB stored full localhost URL, convert it
  if (p.startsWith("http://localhost:5000")) {
    return p.replace("http://localhost:5000", BACKEND_ORIGIN);
  }

  // If DB stored relative path like /uploads/xxx.jpg
  if (p.startsWith("/uploads/")) {
    return `${BACKEND_ORIGIN}${p}`;
  }

  // Already a full https URL (e.g., Cloudinary)
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  return p;
}