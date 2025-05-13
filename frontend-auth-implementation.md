# Mise à jour de l'authentification frontend pour les cookies HttpOnly

Ce document détaille les modifications nécessaires pour adapter le frontend de Metacopi à utiliser le système d'authentification basé sur des cookies HttpOnly pour les refresh tokens.

## Modifications du store d'authentification (Zustand)

Voici comment mettre à jour le store d'authentification pour ne conserver que l'access token en mémoire, sans stocker le refresh token :

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user';
import api from '../api/axiosClient';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

// Création du store Zustand pour l'authentification
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Connexion utilisateur - Stocke seulement l'access token, le refresh token est dans un cookie HttpOnly
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          
          // Remarquez qu'on ne récupère et ne stocke que l'access token et les informations utilisateur
          // Le refresh token est automatiquement stocké en tant que cookie HttpOnly par le serveur
          const { access_token, user } = response.data;
          
          set({
            accessToken: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur lors de la connexion';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Déconnexion utilisateur - Efface les données d'authentification et le cookie de refresh token
      logout: async () => {
        set({ isLoading: true });
        try {
          // Cette requête effacera le cookie de refresh token côté serveur
          await api.post('/auth/logout');
          get().clearAuth();
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          // Même en cas d'erreur, on efface les données locales
          get().clearAuth();
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Rafraîchissement de l'access token à l'aide du refresh token stocké dans le cookie
      refreshAccessToken: async () => {
        try {
          // Pas besoin d'envoyer le refresh token, il est automatiquement inclus dans les cookies
          const response = await api.post('/auth/refresh');
          const { access_token } = response.data;
          
          set({
            accessToken: access_token,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          console.error('Erreur lors du rafraîchissement du token:', error);
          get().clearAuth();
          return false;
        }
      },
      
      // Effacement des données d'authentification
      clearAuth: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
      
      // Mise à jour des informations utilisateur
      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'metacopi-auth',
      // Ne persister que les données non sensibles (pas de tokens)
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
```

## Configuration du client API (Axios)

Mise à jour du client Axios pour inclure automatiquement les credentials (cookies) et l'access token dans les entêtes:

```typescript
// src/api/axiosClient.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Création d'une instance Axios avec la configuration de base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
  // Cette option est ESSENTIELLE pour que les cookies soient envoyés avec les requêtes
  withCredentials: true,
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Si l'erreur est 401 (Unauthorized) et que ce n'est pas déjà une tentative de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tenter de rafraîchir le token
        const success = await useAuthStore.getState().refreshAccessToken();
        
        if (success && originalRequest) {
          // Si le token a été rafraîchi avec succès, réessayer la requête originale
          const accessToken = useAuthStore.getState().accessToken;
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          } else {
            originalRequest.headers = { Authorization: `Bearer ${accessToken}` };
          }
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement automatique du token:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## Exemple d'utilisation dans un composant React

```tsx
// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Connexion</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Mot de passe:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
      </button>
    </form>
  );
};

export default LoginForm;
```

## Création d'un composant AuthGuard pour les routes protégées

```tsx
// src/components/AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/axiosClient';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, accessToken, user, setUser, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      if (accessToken) {
        try {
          // Vérifie si la session est toujours valide en récupérant le profil utilisateur
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsLoading(false);
        } catch (error) {
          console.error('Session invalide:', error);
          clearAuth();
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [accessToken, setUser, clearAuth]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated || !user) {
    // Rediriger vers la page de connexion tout en conservant l'URL ciblée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
```

## Types TypeScript pour l'authentification

```typescript
// src/types/auth.ts
export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student';
  emailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Configuration du routeur

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AuthGuard from './components/AuthGuard';
import { useAuthStore } from './stores/authStore';

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        
        <Route path="/dashboard" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        
        <Route path="/profile" element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
```

## Tests unitaires pour le store d'authentification

```typescript
// src/stores/authStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from './authStore';
import api from '../api/axiosClient';

// Mock du client axios
jest.mock('../api/axiosClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Réinitialiser le store avant chaque test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clearAuth();
    });
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockResponse = { 
      data: { 
        access_token: 'test-access-token',
        user: mockUser
      } 
    };
    
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.login('test@example.com', 'password').catch(() => {});
    });
    
    // Vérifier que l'état de chargement est défini
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    // Vérifier que l'état est correctement mis à jour après la connexion
    expect(result.current.accessToken).toBe('test-access-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
  });

  test('should handle login failure', async () => {
    const errorMsg = 'Invalid credentials';
    const mockError = {
      response: { data: { message: errorMsg } }
    };
    
    (api.post as jest.Mock).mockRejectedValueOnce(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuthStore());
    
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong-password');
      } catch (error) {
        // Expected error
      }
    });
    
    // Vérifier que l'état d'erreur est correctement défini
    expect(result.current.error).toBe(errorMsg);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('should refresh access token', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { access_token: 'new-access-token' }
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.refreshAccessToken();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.accessToken).toBe('new-access-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
  });

  test('should handle logout', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({});
    
    const { result, waitForNextUpdate } = renderHook(() => useAuthStore());
    
    // D'abord, définir un état authentifié
    act(() => {
      result.current.clearAuth();
      useAuthStore.setState({
        accessToken: 'test-token',
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true
      });
    });
    
    act(() => {
      result.current.logout();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });
});
```

## Points importants à noter

1. **HttpOnly Cookies**: Le serveur définit les refresh tokens dans des cookies HttpOnly qui ne sont pas accessibles via JavaScript.

2. **Credentials**: L'option `withCredentials: true` est cruciale dans la configuration d'Axios pour que les cookies soient envoyés avec les requêtes.

3. **Sécurité améliorée**:
   - Le refresh token n'est jamais stocké côté client (ni en mémoire, ni en localStorage)
   - Protection contre les attaques XSS: même si du JavaScript malveillant s'exécute sur la page, il ne peut pas accéder au refresh token
   - Rotation automatique des refresh tokens à chaque rafraîchissement

4. **Gestion des erreurs**: Traitement approprié des erreurs d'authentification avec tentative automatique de rafraîchissement du token.

5. **État de l'application**: L'état d'authentification est géré de manière centralisée via le store Zustand.

6. **Persistance**: Seules les informations non sensibles (comme les données utilisateur) sont persistées, pas les tokens.

7. **Routes protégées**: Le composant AuthGuard protège les routes qui nécessitent une authentification. 