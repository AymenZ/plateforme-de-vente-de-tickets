import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalise le rôle backend (ADMIN/ORGANIZER/CLIENT) en minuscule pour le front
  const normalizeRole = (roleName) => {
    if (!roleName) return 'client';
    const lower = roleName.toLowerCase();
    if (lower === 'organizer') return 'organizer';
    if (lower === 'admin') return 'admin';
    return 'client';
  };

  // Au démarrage : si un token existe, on récupère le profil via /users/me
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Récupère le profil utilisateur depuis le backend
  const fetchProfile = async (accessToken) => {
    try {
      // Le token est déjà dans localStorage, l'intercepteur l'ajoute
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      const res = await usersAPI.getMe();
      const profile = {
        id: res.data.id,
        email: res.data.email,
        role_id: res.data.role_id,
        role: normalizeRole(res.data.role_name),
        role_name: res.data.role_name,
      };
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch (err) {
      // Token invalide / expiré
      console.error('Profil invalide, déconnexion.', err);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  // Login : appelle POST /auth/login puis GET /users/me
  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      const accessToken = res.data.access_token;
      setToken(accessToken);
      localStorage.setItem('access_token', accessToken);

      // Récupère le profil complet
      const profileRes = await usersAPI.getMe();
      const profile = {
        id: profileRes.data.id,
        email: profileRes.data.email,
        role_id: profileRes.data.role_id,
        role: normalizeRole(profileRes.data.role_name),
        role_name: profileRes.data.role_name,
      };
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));

      return { success: true, user: profile };
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Email ou mot de passe incorrect.';
      return { success: false, message };
    }
  };

  // Register : appelle POST /auth/register puis GET /users/me
  const register = async (email, password) => {
    try {
      const res = await authAPI.register(email, password);
      const accessToken = res.data.access_token;
      setToken(accessToken);
      localStorage.setItem('access_token', accessToken);

      // Récupère le profil complet
      const profileRes = await usersAPI.getMe();
      const profile = {
        id: profileRes.data.id,
        email: profileRes.data.email,
        role_id: profileRes.data.role_id,
        role: normalizeRole(profileRes.data.role_name),
        role_name: profileRes.data.role_name,
      };
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));

      return { success: true, user: profile };
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Erreur lors de l\'inscription.';
      return { success: false, message };
    }
  };

  // Logout
  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const logout = () => {
    clearSession();
  };

  // Helpers
  const isAdmin = () => user?.role === 'admin';
  const isOrganizer = () => user?.role === 'organizer';
  const isClient = () => user?.role === 'client';
  const isAuthenticated = () => !!token;

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isOrganizer,
    isClient,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
