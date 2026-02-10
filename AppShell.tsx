import * as React from 'react';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import OwnerDashboard from './components/OwnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import App from './App';
import { getCurrentUser, isLoggedIn, handleGoogleLoginCallback } from './services/authService';
import { supabase, isConfigMissing } from './services/supabaseClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertTriangle, Settings, RefreshCw } from 'lucide-react';

const AppShellContent: React.FC = () => {
  const { user, setUser, setProjectId, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [managingProject, setManagingProject] = useState(false);

  // Show configuration warning if environment variables are missing
  if (isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">Configuration Required</h2>
          <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
            Your application is running, but the <span className="text-indigo-600">Supabase API Keys</span> are not configured in your Netlify environment settings.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
              <Settings className="w-4 h-4" /> Required Variables:
            </div>
            <ul className="space-y-2 opacity-80">
              <li className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> VITE_SUPABASE_URL
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> VITE_SUPABASE_ANON_KEY
              </li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Check Again
          </button>
        </div>
      </div>
    );
  }

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
