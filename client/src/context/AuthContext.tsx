import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { authService } from "../services/authService";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshMe = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      logout();
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
      setToken(currentToken);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch (_error) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (_error) {
          localStorage.removeItem(USER_KEY);
        }
      }

      refreshMe().finally(() => setInitialized(true));
      return;
    }

    setInitialized(true);
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      token,
      initialized,
      login,
      logout,
      refreshMe,
    }),
    [user, token, initialized, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

