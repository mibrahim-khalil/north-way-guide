import { api } from "./api";

export async function requireLogin(
  navigate,
  toast,
  message = "Please login to continue",
  fromPath = "/"
) {
  try {
    // cookie-based check
    await api.get("/auth/me");
    return true;
  } catch {
    toast?.(message, 2000);
    navigate("/login", { state: { from: fromPath }, replace: true });
    return false;
  }
}