import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    // store token for protected routes like /chat
    if (res.data?.token) localStorage.setItem("token", res.data.token);

    setUser(res.data.user);
    return res.data.user;
  };

  // register: sends OTP, does NOT login
  const register = async (name, email, password, phone, accountType) => {
    const res = await api.post("/auth/register", { name, email, password, phone, accountType });
    return res.data;
  };

  // verifyEmail: checks OTP + logs user in
  const verifyEmail = async (email, code) => {
    const res = await api.post("/auth/verify-email", { email, code });

    // store token for protected routes like /chat
    if (res.data?.token) localStorage.setItem("token", res.data.token);

    setUser(res.data.user);
    return res.data.user;
  };

  const resendOtp = async (email) => {
    const res = await api.post("/auth/resend-otp", { email });
    return res.data;
  };

  const logout = async () => {
    localStorage.removeItem("token");

    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }

    setUser(null);
  };

  const updateProfile = async ({ name, phone }) => {
    const res = await api.put("/users/me", { name, phone });
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        verifyEmail,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);