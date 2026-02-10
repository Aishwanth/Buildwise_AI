import React, { useEffect, useState } from 'react';
import { User, LogOut, Save, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOwnerProjects, getClientProjects, updateUser, logout as serviceLogout } from '../services/authService';

const Profile: React.FC = () => {
  const { user, setUser, logout, setProjectId } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [personalCode, setPersonalCode] = useState<string | null>(LocalPersonalCode());

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    let mounted = true;
    (async () => {
      try {
        if (user.role === 'owner') {
          const data = await getOwnerProjects(user.id);
          if (mounted) setProjects(data || []);
        } else {
          // for clients, ensure they have at least one project (with access code)
          try {
            const { ensureClientHasProject } = await import('../services/authService');
            await ensureClientHasProject(user.id, user.name);
          } catch (e) {
            // ignore ensure errors
          }
          const data = await getClientProjects(user.id);
          if (mounted) setProjects(data || []);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [open, user]);

  function LocalPersonalCode() {
    try {
      return localStorage.getItem('buildwise_personal_code');
    } catch (e) {
      return null;
    }
  }

  const generateCode = (): string => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const generateUniquePersonalCode = async () => {
    if (personalCode) return; // don't regenerate
    let attempts = 0;
    let code = generateCode();
    const existing = new Set((projects || []).map((p: any) => (p.access_code || '').toString()));
    while (existing.has(code) && attempts < 10) {
      code = generateCode();
      attempts += 1;
    }
    try {
      localStorage.setItem('buildwise_personal_code', code);
      setPersonalCode(code);
      // try to persist to server; ignore failures
      if (user && user.id) {
        await updateUser(user.id, { personal_code: code } as any);
      }
    } catch (e) {
      // ignore persistence errors
    }
  };

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUser(user.id, { name, email });
      const newUser = { ...user, name: updated.name, email: updated.email };
      setUser(newUser);
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    try {
      serviceLogout();
    } finally {
      setProjectId(null);
      logout();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((s) => !s)}
        className="bg-white/5 text-white px-4 py-2 rounded-xl flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        Profile
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black">Profile</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded-lg text-white text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <label className="text-slate-400 text-xs">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 text-white outline-none" />

            <label className="text-slate-400 text-xs">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 text-white outline-none" />
          </div>

          <div className="flex justify-between items-center mb-4">
            <button onClick={handleSave} disabled={saving} className="bg-blue-600 px-4 py-2 rounded-lg text-white flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <div className="text-xs text-slate-400">Role: <span className="font-black text-white ml-1">{user.role}</span></div>
          </div>

          <div>
            <p className="text-slate-400 text-xs font-bold uppercase mb-2">Project Codes</p>
            {projects.length === 0 ? (
              <p className="text-slate-500 text-sm">No projects found</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                    <div>
                      <div className="text-sm font-black text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-900/40 px-2 py-1 rounded text-white font-black">{p.access_code}</code>
                      <button onClick={() => copyCode(p.access_code)} className="bg-blue-600 text-white px-2 py-1 rounded">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
            <div className="mt-4">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Personal Code</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  {personalCode ? (
                    <code className="bg-slate-900/40 px-3 py-2 rounded text-white font-black">{personalCode}</code>
                  ) : (
                    <p className="text-slate-500 text-sm">No personal code yet</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={generateUniquePersonalCode} disabled={!!personalCode} className="bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded">{personalCode ? 'Generated' : 'Generate'}</button>
                  {personalCode && (
                    <button onClick={() => { navigator.clipboard.writeText(personalCode); }} className="bg-blue-600 text-white px-3 py-1 rounded">Copy</button>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">A 5-digit personal code stored locally for quick sharing.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
