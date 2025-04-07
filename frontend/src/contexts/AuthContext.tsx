import { createContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);
