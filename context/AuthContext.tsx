import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'client';
}

interface AuthContextType {
  user: AuthUser | null;
  projectId: string | null;
  setUser: (user: AuthUser | null) => void;
  setProjectId: (projectId: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('buildwise_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [projectId, setProjectId] = useState<string | null>(() => {
    return localStorage.getItem('buildwise_project_id');
  });

  const handleLogout = () => {
    setUser(null);
    setProjectId(null);
    localStorage.removeItem('buildwise_user');
    localStorage.removeItem('buildwise_token');
    localStorage.removeItem('buildwise_project_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        projectId,
        setUser,
        setProjectId,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
