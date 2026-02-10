import * as React from 'react';
import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Loader, Construction } from 'lucide-react';
import { login, signUp, isLoggedIn, loginWithGoogle } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'owner' | 'client'>('owner');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }

      const user = await login({
        email: formData.email,
        password: formData.password,
      });

      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error detail:', err);
      setError(err.message || JSON.stringify(err) || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('All fields are required');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: role,
      });

      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Sign-up error detail:', err);
      setError(err.message || JSON.stringify(err) || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative font-sans overflow-hidden"
      style={{
        backgroundImage: `url("/home1.img.jpeg")`,
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Brighter, more professional overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/60 backdrop-blur-[2px]"></div>

      {/* Structural Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 login-card opacity-0">
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/40">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-3xl mb-6 shadow-xl shadow-orange-900/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border-2 border-white/20">
              <Construction className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">
              Build<span className="text-orange-600">Wise</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              {isSignUp ? 'Structural Registration' : 'Secure Platform Access'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-5 bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-[1.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700/80">{error}</p>
            </div>
          )}

          {/* Role Selector (Signup only) */}
          {isSignUp && (
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block text-center">
                Assign Authority Level
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['owner', 'client'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-6 py-4 rounded-2xl font-black uppercase text-[11px] transition-all duration-300 ${role === r
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.05]'
                      : 'bg-white/50 text-slate-400 border border-slate-100 hover:bg-white hover:text-slate-600'
                      }`}
                  >
                    {r === 'owner' ? '👔 Project Owner' : '👨‍💼 Client Portal'}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-orange-600/70 font-black uppercase tracking-tighter">
                  {role === 'owner' ? '✓ Master control & project generation' : '✓ Read-only oversight & progress tracking'}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
            {/* Name Field (Signup only) */}
            {isSignUp && (
              <div style={{ animationDelay: '100ms' }} className="animate-in fade-in slide-in-from-bottom-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-2 block italic">
                  Stakeholder Name
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full pl-14 pr-6 py-5 bg-white/50 rounded-2xl border border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none font-bold text-slate-700 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div style={{ animationDelay: '200ms' }} className="animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-2 block italic">
                Verified Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@buildwise.com"
                  className="w-full pl-14 pr-6 py-5 bg-white/50 rounded-2xl border border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none font-bold text-slate-700 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ animationDelay: '300ms' }} className="animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-2 block italic">
                Secure Pin
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-white/50 rounded-2xl border border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none font-bold text-slate-700 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-900/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {isSignUp ? 'Establishing Connection...' : 'Verifying Identity...'}
                </>
              ) : (
                isSignUp ? 'Initialize Account' : 'Authenticate Access'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise OAuth</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={async () => {
              setIsLoading(true);
              setError('');
              try {
                await loginWithGoogle(role);
              } catch (err: any) {
                setError(err.message || 'Google verification failed');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full bg-white/50 text-slate-800 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md border border-slate-100 hover:bg-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Identity
          </button>

          {/* Toggle Form */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({ email: '', password: '', name: '' });
              }}
              className="group flex items-center justify-center gap-2 w-full"
            >
              <span className="text-slate-500 font-bold text-xs">
                {isSignUp ? 'Established user?' : 'New stakeholder?'}
              </span>
              <span className="text-orange-600 font-black text-xs uppercase tracking-widest group-hover:underline underline-offset-4 decoration-2">
                {isSignUp ? 'Login Access' : 'Create Portal'}
              </span>
            </button>
          </div>
        </div>

        {/* Branding Footer */}
        <p className="mt-8 text-center text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">
          Precision Built By BuildWise Systems
        </p>
      </div>
    </div>
  );
};

export default Login;
