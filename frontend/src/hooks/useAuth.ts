import { useState, useEffect } from 'react';
import { authService } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('[Auth] Token no localStorage:', token ? 'Presente' : 'Ausente');
    if (token) {
      checkAuth();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[Auth] Verificando autenticação...');
      const data = await authService.refreshToken();
      console.log('[Auth] Refresh token bem sucedido:', data);
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[Auth] Erro ao verificar autenticação:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sessão expirada',
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[Auth] Iniciando login...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const data = await authService.login(email, password);
      console.log('[Auth] Login bem sucedido:', data);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[Auth] Erro ao fazer login:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Credenciais inválidas',
      }));
    }
  };

  const logout = () => {
    console.log('[Auth] Realizando logout...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...state,
    login,
    logout,
  };
}
