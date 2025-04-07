import { useState, useCallback, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/axios";
import { AxiosError } from "axios";
import { AuthContext } from "../contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface ApiError {
  message: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      !!localStorage.getItem("access_token") && !!localStorage.getItem("user")
    );
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await api.post("/auth/login", { email, password });
        const { access_token, user } = data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);
        navigate("/");
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage =
          axiosError.response?.data?.message || "Erro ao fazer login";
        setError(errorMessage);
        console.error("[useAuth] Erro ao fazer login:", errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await api.post("/auth/register", { name, email, password });
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        setError(
          axiosError.response?.data?.message || "Erro ao registrar usuário"
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || "Erro ao fazer logout");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        register,
        error,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
