const KEY = "nw_admin_token";

export const adminAuth = {
  login(email, password) {
    if (!email || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    if (email !== "admin@example.com" || password !== "123") {
      return { ok: false, message: "Invalid credentials (UI mock)." };
    }

    localStorage.setItem(KEY, "mock-admin-token");
    return { ok: true };
  },

  logout() {
    localStorage.removeItem(KEY);
  },

  isLoggedIn() {
    return Boolean(localStorage.getItem(KEY));
  },
};