"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  planTier: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  workspace: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success && json.data?.authenticated) {
        setUser(json.data.user);
        setWorkspace(json.data.workspace);
      } else {
        setUser(null);
        setWorkspace(null);
      }
    } catch {
      setUser(null);
      setWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || "Failed to sign in. Please verify your credentials.",
        };
      }

      setUser(json.data.user);
      setWorkspace(json.data.workspace);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error signing in.",
      };
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || "Failed to register account.",
        };
      }

      setUser(json.data.user);
      setWorkspace(json.data.workspace);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error during registration.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setWorkspace(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
