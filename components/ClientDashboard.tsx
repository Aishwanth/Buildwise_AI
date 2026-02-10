import React, { useState, useEffect } from 'react';
import { LogOut, Lock, Loader, AlertCircle, Eye } from 'lucide-react';
import { verifyAndGrantAccess, getClientProjects, logout } from '../services/authService';
import Profile from './Profile';

interface ClientDashboardProps {
  user: any;
  onLogout: () => void;
  onSelectProject: (projectId: string) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogout, onSelectProject }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    loadAccessibleProjects();
  }, []);

  const loadAccessibleProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getClientProjects(user.id);
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    try {
      setIsVerifying(true);
      const result = await verifyAndGrantAccess(user.id, accessCode.toUpperCase());
      setSuccess(result.message);
      setAccessCode('');

      // Reload projects
      await loadAccessibleProjects();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Invalid access code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white">Client Dashboard</h1>
            <p className="text-slate-300 font-medium">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Profile />
            <button
              onClick={() => {
                logout();
                onLogout();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Access Code Entry Section */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Instructions */}
            <div>
              <h2 className="text-2xl font-black text-white mb-6">Get Project Access</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="text-2xl">📝</div>
                  <div>
                    <p className="text-white font-black">Get Access Code</p>
                    <p className="text-slate-400 text-sm font-medium">Ask your project owner for the access code</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">✋</div>
                  <div>
                    <p className="text-white font-black">Enter Code Below</p>
                    <p className="text-slate-400 text-sm font-medium">Paste the code you received (e.g., ABC12345)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">👁️</div>
                  <div>
                    <p className="text-white font-black">View Project Data</p>
                    <p className="text-slate-400 text-sm font-medium">Access all project analytics and updates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              {/* Success Alert */}
              {success && (
                <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-2xl flex items-start gap-3">
                  <span className="text-green-400 font-black text-lg">✓</span>
                  <p className="text-sm font-bold text-green-300">{success}</p>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                    Access Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value.toUpperCase());
                        setError('');
                      }}
                      placeholder="e.g., ABC12345"
                      className="w-full pl-12 pr-5 py-4 bg-white/10 rounded-2xl border border-white/20 text-white placeholder-slate-400 font-black text-lg tracking-wider uppercase outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !accessCode.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Unlock Project
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Accessible Projects */}
        <div>
          <h2 className="text-2xl font-black text-white mb-8">Your Projects</h2>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 text-blue-400 animate-spin mr-4" />
              <span className="text-slate-300 font-bold">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-12 text-center">
              <Eye className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 font-bold mb-2">No projects yet</p>
              <p className="text-slate-500 text-sm">Enter an access code above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 hover:border-white/30 hover:bg-white/10 transition-all group text-left"
                >
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <Eye className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    {project.description && (
                      <p className="text-slate-400 text-sm font-medium">{project.description}</p>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Owner</span>
                      <span className="text-white font-black">Project Owner</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Access Date</span>
                      <span className="text-white font-black">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-black opacity-0 group-hover:opacity-100 transition-all text-center">
                    View Data
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">ℹ️ About Client Access</p>
          <ul className="space-y-2 text-sm text-slate-300 font-medium">
            <li>• 🔒 Access codes are unique and can be shared with multiple clients</li>
            <li>• 👀 Clients can only VIEW data (read-only mode)</li>
            <li>• 📊 All project analytics and history are accessible</li>
            <li>• 🔄 Data updates in real-time as the owner adds information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
