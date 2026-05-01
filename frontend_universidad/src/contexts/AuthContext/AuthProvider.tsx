"use client";
import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { AuthContext } from "./AuthContext";
import { AuthProviderProps } from "./AuthContext.types";
import { AuthState, User, LoginCredentials } from "@/lib/types/auth.types";
import { authService } from "@/services/auth.service";

const COOKIE_NAME = "univ_auth_session";

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const savedSession = Cookies.get(COOKIE_NAME);
    if (savedSession) {
      try {
        const restoredUser = JSON.parse(savedSession);
        if (restoredUser && (restoredUser.token || restoredUser.accessToken)) {
          setAuthState({
            user: restoredUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          throw new Error("Sesión inválida");
        }
      } catch (error) {
        console.error("Error al restaurar sesión:", error);
        Cookies.remove(COOKIE_NAME);
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  // --- FUNCIÓN PARA ACTUALIZAR USUARIO (LA QUE FALTABA) ---
  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState((prev) => {
      if (!prev.user) return prev;
      
      const updatedUser = { ...prev.user, ...userData };
      
      // Sincronizamos con la Cookie para que no se pierda al recargar
      Cookies.set(COOKIE_NAME, JSON.stringify(updatedUser), {
        expires: 1,
        path: "/",
        sameSite: "lax",
      });

      return {
        ...prev,
        user: updatedUser,
      };
    });
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      try {
        const userData: any = await authService.login(credentials);

        if (userData) {
          const fullUser: User & { token: string } = {
            id: userData.id || 0,
            username: userData.usuario || userData.username || "",
            name:
              userData.name ||
              `${userData.nombre || ""} ${userData.apellido || ""}`.trim() ||
              "Usuario",
            email: userData.email || "",
            role: userData.role || "estudiante",
            avatar: userData.avatar || "",
            token: userData.token,
          };

          setAuthState({
            user: fullUser,
            isAuthenticated: true,
            isLoading: false,
          });

          Cookies.set(COOKIE_NAME, JSON.stringify(fullUser), {
            expires: 1,
            path: "/",
            sameSite: "lax",
          });

          return true;
        }
        return false;
      } catch (error: any) {
        const message = error.response?.data?.message || "Error de conexión";
        throw new Error(message);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    Cookies.remove(COOKIE_NAME);
    if (typeof window !== "undefined") window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      // Ahora pasamos la función real 'updateUser'
      value={{ ...authState, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
