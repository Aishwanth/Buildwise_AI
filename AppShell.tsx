import * as React from 'react';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import OwnerDashboard from './components/OwnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import App from './App';
import { getCurrentUser, isLoggedIn, handleGoogleLoginCallback } from './services/authService';
import { supabase } from './services/supabaseClient';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppShellContent: React.FC = () => {
  const { user, setUser, setProjectId, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [managingProject, setManagingProject] = useState(false);

  useEffect(() => {
    // Check for existing session
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
    setLoading(false);

    // Listen for Supabase Auth changes (Google Login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const authUser = await handleGoogleLoginCallback(session.user);
          setUser(authUser);
        } catch (e) {
          console.error("Error handling auth change:", e);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setUser(user);
        }}
      />
    );
  }

  if (user.role === 'owner' && !managingProject) {
    return (
      <OwnerDashboard
        user={user}
        onLogout={() => {
          logout();
          setUser(null);
        }}
        onSelectProject={(projectId) => {
          setProjectId(projectId);
          localStorage.setItem('buildwise_project_id', projectId);
          setManagingProject(true);
        }}
      />
    );
  }

  // Both clients and owners (when managing) use the main App
  if (user.role === 'client' || (user.role === 'owner' && managingProject)) {
    return (
      <div className="relative">
        <App />
        {user.role === 'owner' && (
          <button
            onClick={() => setManagingProject(false)}
            className="fixed top-4 left-4 z-[100] bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs shadow-2xl border border-white/10 hover:bg-blue-600 transition-all"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  return null;
};

const AppShell: React.FC = () => {
  return (
    <AuthProvider>
      <AppShellContent />
    </AuthProvider>
  );
};

export default AppShell;
