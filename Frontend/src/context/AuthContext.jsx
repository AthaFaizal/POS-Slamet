import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/authService.js";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const restoreSession =
      async () => {
        try {
          const currentUser =
            await getCurrentUser();

          setUser(currentUser);
        } catch (error) {
          console.error(
            "RESTORE SESSION ERROR:",
            error
          );

          setUser(null);
        } finally {
          setLoading(false);
        }
      };

    restoreSession();
  }, []);

  const login =
    async (
      username,
      password
    ) => {
      const result =
        await loginUser({
          username,
          password,
        });

      setUser(result.user);

      return result.user;
    };

  const logout =
    async () => {
      try {
        await logoutUser();
      } finally {
        setUser(null);
      }
    };

  const value =
    useMemo(
      () => ({
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        isAdmin:
          user?.role ===
          "admin",
        login,
        logout,
      }),
      [user, loading]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth harus digunakan di dalam AuthProvider."
    );
  }

  return context;
}
