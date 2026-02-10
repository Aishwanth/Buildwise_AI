
import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Copy,
  RefreshCw,
  Settings,
  Loader,
  AlertCircle,
  Search,
  ExternalLink,
  Clock,
  Users,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  Calendar,
  DollarSign,
  X,
  Eye,
  Zap,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Folder,
  Upload
} from 'lucide-react';
import { getOwnerProjects, getProjectByAccessCode, logout, getUserByPersonalCode, getClientProjects } from '../services/authService';
import { getWorkEntries } from '../services/supabaseClient';
import { INITIAL_WORKERS } from '../constants';
import { ProjectDataSync } from '../services/dataSync';
import Profile from './Profile';

interface OwnerDashboardProps {
  user: any;
  onLogout: () => void;
  onSelectProject: (projectId: string) => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onLogout, onSelectProject }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupClient, setLookupClient] = useState<any | null>(null);
  const [lookupProjects, setLookupProjects] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Detailed Project View State (Merged from OwnerProjectPortal)
  const [viewingProjectCode, setViewingProjectCode] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState<any[]>([]);
  const [workersData, setWorkersData] = useState<any[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<any>(null);
  const [billsData, setBillsData] = useState<any[]>([]);
  const [selectedBillPhoto, setSelectedBillPhoto] = useState<string | null>(null);
  const [archiveTab, setArchiveTab] = useState<'documents' | 'photos'>('documents');

  // Worker Safety & Attendance State
  const [safetyVerified, setSafetyVerified] = useState<Record<string, boolean>>({});
  const [markedAttendance, setMarkedAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getOwnerProjects(user.id);
      setProjects(data || []);

      // CRITICAL FIX: Sync projects to localStorage for Owner Portal
      syncProjectsToLocalStorage(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Syncs Supabase projects to localStorage so Owner Portal can access them
   */
  const syncProjectsToLocalStorage = (supabaseProjects: any[]) => {
    try {
      // Transform Supabase projects to the format Owner Portal expects
      const formattedProjects = supabaseProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        projectCode: project.access_code, // Map access_code to projectCode
        code: project.access_code, // Also store as 'code' for compatibility
        access_code: project.access_code,
        created_at: project.created_at,
        owner_id: project.owner_id,
        // Add any other fields the Owner Portal might need
        timeline: project.timeline || null,
      }));

      // Store in localStorage
      localStorage.setItem('buildwise_projects', JSON.stringify(formattedProjects));
      console.log('✅ Synced projects to localStorage:', formattedProjects.length);
    } catch (err) {
      console.error('❌ Failed to sync projects to localStorage:', err);
    }
  };

  const handleOpenProject = async () => {
    if (!accessCodeInput.trim()) return;
    const code = accessCodeInput.trim().toUpperCase();

    // Check if it's the master code first
    if (code === 'BW-MASTER-2026') {
      loadDetailedProject(code);
      return;
    }

    try {
      setLookupLoading(true);
      setError('');
      const project = await getProjectByAccessCode(code);
      if (!project) throw new Error('Project not found');

      // Sync this specific project to localStorage
      syncSingleProjectToLocalStorage(project);

      // Instead of navigating away, load details right here
      loadDetailedProject(code);
    } catch (err: any) {
      setError(err.message || 'Failed to open project');
    } finally {
      setLookupLoading(false);
    }
  };

  /**
   * Loads the full project details (Daily Updates, Workers, Bills)
   * This is merged from OwnerProjectPortal.tsx
   */
  const loadDetailedProject = async (code: string) => {
    setDetailsLoading(true);
    setViewingProjectCode(code);
    setError('');
    const normalizedCode = code.trim().toUpperCase();

    // MASTER DEMO CODE HANDLING
    if (normalizedCode === 'BW-MASTER-2026') {
      console.log("BW-DEBUG: Master Demo Code Activated in Dashboard");
      setTimeout(() => {
        setDailyUpdates([
          {
            date: new Date().toISOString(),
            description: "Second floor slab casting completed successfully. Quality audit passed for reinforcement. Electrical conduits for ceiling points laid out.",
            photos: [{ id: '1', name: "Slab Casting", dataUrl: "https://images.unsplash.com/photo-1541913057-08ca18485227?auto=format&fit=crop&w=800&q=80", uploadedAt: new Date().toISOString() }]
          },
          {
            date: new Date(Date.now() - 86400000).toISOString(),
            description: "Plumbing vertical stacks installed for bathrooms. Brickwork for main partition walls reached lintel level.",
            photos: [{ id: '2', name: "Partition Walls", dataUrl: "https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&w=800&q=80", uploadedAt: new Date().toISOString() }]
          },
          {
            date: new Date(Date.now() - 172800000).toISOString(),
            description: "Site clearance and foundation preparation for annex building. All safety protocols verified.",
            photos: []
          }
        ]);

        setWorkersData(INITIAL_WORKERS.concat([
          { id: '5', name: 'Alok Kumar', role: 'Carpenter' as any, dailyWage: 950, attendance: [] },
          { id: '6', name: 'Rajesh Varma', role: 'Steel Worker' as any, dailyWage: 850, attendance: [] }
        ]));

        setEstimatedTime({ days: 145, weeks: 21, months: 5 });

        setBillsData([
          { name: "Cement Invoice #991", photo: "https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=400&q=80", date: "2026-02-01" },
          { name: "Steel Supply Order", photo: "https://images.unsplash.com/photo-1518381328518-d0ad33244851?auto=format&fit=crop&w=400&q=80", date: "2026-02-03" },
          { name: "Electrical Fittings", photo: "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&w=400&q=80", date: "2026-02-04" }
        ]);

        setDetailsLoading(false);
      }, 800);
      return;
    }

    try {
      // Step 1: Validate project code exists
      const storedProjects = ProjectDataSync.getProjects();

      const matchingProject = storedProjects.find(
        (p: any) => p.projectCode?.toUpperCase() === normalizedCode || p.code?.toUpperCase() === normalizedCode || p.access_code?.toUpperCase() === normalizedCode
      );

      // Fetch Daily Updates filtered by project code
      let updates = [];
      try {
        const allUpdates = await getWorkEntries();
        updates = allUpdates.filter((u: any) =>
          u.project_code?.toUpperCase() === normalizedCode ||
          u.projectCode?.toUpperCase() === normalizedCode
        );
      } catch (e) {
        updates = ProjectDataSync.getProjectWorkEntries().filter(u =>
          u.projectCode?.toUpperCase() === normalizedCode || u.project_code?.toUpperCase() === normalizedCode
        );
      }

      // Fetch Workers filtered by project code
      const allWorkers = ProjectDataSync.getWorkers();
      const projectWorkers = allWorkers.filter((w: any) =>
        w.projectCode?.toUpperCase() === normalizedCode ||
        w.project_code?.toUpperCase() === normalizedCode
      );

      const finalWorkers = projectWorkers.length > 0 ? projectWorkers : INITIAL_WORKERS;

      // Fetch Estimated Time
      let time = null;
      if (matchingProject && matchingProject.timeline) {
        time = matchingProject.timeline;
      } else {
        const storedResults = localStorage.getItem('buildwise_scenario_results');
        if (storedResults) {
          const results = JSON.parse(storedResults);
          const projectResult = results[normalizedCode];
          if (projectResult?.timeline) {
            time = projectResult.timeline;
          }
        }
      }

      // Fetch Bills
      const allMaterials = ProjectDataSync.getMaterials();
      const projectMaterials = allMaterials.filter((m: any) =>
        m.projectCode?.toUpperCase() === normalizedCode ||
        m.project_code?.toUpperCase() === normalizedCode
      );

      const billPhotos = projectMaterials
        .filter((m: any) => m && (m.billPhoto || m.bill_photo))
        .map((m: any) => ({
          name: m.name,
          photo: m.billPhoto?.dataUrl || m.bill_photo?.url,
          date: m.bill_photo?.uploaded_at || m.billPhoto?.uploadedAt || 'N/A'
        }));

      setDailyUpdates(updates);
      setWorkersData(finalWorkers);
      setEstimatedTime(time);
      setBillsData(billPhotos);
    } catch (err: any) {
      setError(err.message || 'Failed to open project details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  /**
   * Syncs a single project to localStorage
   */
  const syncSingleProjectToLocalStorage = (project: any) => {
    try {
      const existingProjects = JSON.parse(localStorage.getItem('buildwise_projects') || '[]');

      // Check if project already exists
      const existingIndex = existingProjects.findIndex(
        (p: any) => p.id === project.id || p.access_code === project.access_code
      );

      const formattedProject = {
        id: project.id,
        name: project.name,
        description: project.description,
        projectCode: project.access_code,
        code: project.access_code,
        access_code: project.access_code,
        created_at: project.created_at,
        owner_id: project.owner_id,
        timeline: project.timeline || null,
      };

      if (existingIndex >= 0) {
        // Update existing project
        existingProjects[existingIndex] = formattedProject;
      } else {
        // Add new project
        existingProjects.push(formattedProject);
      }

      localStorage.setItem('buildwise_projects', JSON.stringify(existingProjects));
      console.log('✅ Synced single project to localStorage:', project.access_code);
    } catch (err) {
      console.error('❌ Failed to sync single project:', err);
    }
  };

  const handleLookupClient = async () => {
    if (!lookupCode.trim()) return;
    setLookupClient(null);
    setLookupProjects([]);
    setLookupLoading(true);
    setError('');
    try {
      const authService = await import('../services/authService');
      const client = await authService.getUserByPersonalCode(lookupCode.trim());
      if (!client) {
        setError('Client not found');
        return;
      }
      setLookupClient(client);
      const clientProjects = await authService.getClientProjects(client.id);
      setLookupProjects(clientProjects || []);

      // Sync looked-up projects to localStorage as well
      if (clientProjects && clientProjects.length > 0) {
        syncProjectsToLocalStorage(clientProjects);
      }
    } catch (err: any) {
      setError(err.message || 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /**
   * Render the detailed project view (replaces the main dashboard content)
   */
  const renderDetailedProject = () => {
    if (detailsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-black text-white">Accessing Secure Vault...</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Project Code: {viewingProjectCode}</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        {/* Detail Header */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg ring-4 ring-blue-500/20">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Project: {viewingProjectCode}</h2>
              <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest mt-1">Universal Portals Connected</p>
            </div>
          </div>
          <button
            onClick={() => setViewingProjectCode(null)}
            className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 group active:scale-90"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Updates Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl h-full max-h-[800px] overflow-auto custom-scrollbar">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Daily Work Stream</h3>
              </div>

              <div className="space-y-6">
                {dailyUpdates.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No updates logged yet</p>
                  </div>
                ) : (
                  dailyUpdates.map((update, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-white/10 pb-6 group hover:border-blue-500 transition-all">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-700 group-hover:bg-blue-500 border-4 border-[#0F172A] transition-all" />
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">
                        {new Date(update.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-slate-200 leading-relaxed mb-3">{update.description}</p>
                      {update.photos && update.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                          {update.photos.map((p: any, idx: number) => (
                            <img key={idx} src={p.dataUrl} className="w-16 h-16 rounded-xl object-cover border border-white/10 hover:border-blue-500 transition-all cursor-pointer" title={p.name} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Details Center */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                <Users className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Workforce Deployed</h4>
                <p className="text-6xl font-black mb-4">{workersData.length}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(workersData.map(w => w.role))).slice(0, 4).map((r, i) => (
                    <span key={i} className="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase backdrop-blur-md">{r}</span>
                  ))}
                  {workersData.length > 4 && <span className="text-[9px] font-black uppercase opacity-60">+{workersData.length - 4} More</span>}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden group">
                <Clock className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-5 group-hover:scale-110 transition-transform text-white" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Timeline</h4>
                <p className="text-6xl font-black text-white mb-4">{estimatedTime?.days || '--'} <span className="text-2xl opacity-50">Days</span></p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span>On-Track for Week {estimatedTime?.weeks || '--'} Delivery</span>
                </div>
              </div>
            </div>

            {/* Workers Grid */}
            {/* Workers Grid with Safety & Attendance */}
            {/* Workers Grid */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Project Workforce</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workersData.slice(0, 6).map((w, i) => (
                  <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border ${markedAttendance[w.id]
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                        }`}>
                        {w.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{w.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{w.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900/50 px-3 py-2 rounded-xl border border-white/10 shadow-inner">
                        <p className="text-[11px] font-black text-blue-400">₹{w.dailyWage}</p>
                      </div>

                      {/* Individual Safety Verification Button */}
                      <button
                        onClick={() => setSafetyVerified(prev => ({ ...prev, [w.id]: !prev[w.id] }))}
                        className={`p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-95 ${safetyVerified[w.id]
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                          }`}
                        title={safetyVerified[w.id] ? "Safety Verified" : "Click to Verify Safety"}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>

                      {/* Attendance Button */}
                      <button
                        onClick={() => setMarkedAttendance(prev => ({ ...prev, [w.id]: true }))}
                        disabled={!safetyVerified[w.id] || markedAttendance[w.id]}
                        className={`p-2.5 rounded-xl transition-all border ${markedAttendance[w.id]
                          ? 'bg-emerald-500 text-slate-900 border-emerald-400 cursor-default'
                          : safetyVerified[w.id]
                            ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-lg active:scale-90'
                            : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-50'
                          }`}
                        title={!safetyVerified[w.id] ? "Verify safety protocols first" : markedAttendance[w.id] ? "Attendance Marked" : "Mark Present"}
                      >
                        {markedAttendance[w.id] ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
                {workersData.length > 6 && (
                  <div className="md:col-span-2 text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                      + {workersData.length - 6} additional site personnel records
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Digital Site Archive (Documents & Photos) */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-white uppercase text-xs tracking-widest">Digital Site Archive</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setArchiveTab('documents')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${archiveTab === 'documents' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                  >
                    Documents
                  </button>
                  <button
                    onClick={() => setArchiveTab('photos')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${archiveTab === 'photos' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                  >
                    Progress Photos
                  </button>
                </div>
              </div>

              {archiveTab === 'documents' ? (
                <div className="space-y-4">
                  {/* Upload Box */}
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-300 font-bold text-sm mb-1">Upload Site Documents</p>
                    <p className="text-slate-500 text-xs">PDF, DOCX, XLSX (Max 50MB)</p>
                  </div>

                  {/* Document List */}
                  <div className="space-y-2">
                    {[
                      { name: 'Structural_Audit_Report_v2.pdf', size: '2.4 MB', date: 'Today, 10:30 AM', type: 'PDF' },
                      { name: 'Material_Procurement_List_Nov.xlsx', size: '850 KB', date: 'Yesterday', type: 'XLSX' },
                      { name: 'Safety_Compliance_Checklist.docx', size: '1.2 MB', date: 'Nov 12, 2025', type: 'DOC' },
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-800 rounded-lg text-slate-400 font-black text-[10px] uppercase">
                            {doc.type}
                          </div>
                          <div>
                            <p className="text-slate-200 font-bold text-sm group-hover:text-blue-400 transition-colors">{doc.name}</p>
                            <p className="text-slate-500 text-xs">{doc.size} • {doc.date}</p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Upload Box */}
                  <div className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all cursor-pointer group">
                    <Upload className="w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-slate-400 text-xs font-bold">Add Photo</p>
                  </div>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-800 rounded-2xl overflow-hidden relative group">
                      <img src={`https://source.unsplash.com/random/400x400?construction,building&sig=${i}`} alt="Progress" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-black uppercase tracking-widest">View</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bills Gallery */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-white uppercase text-xs tracking-widest">Billing Vault</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Multi-Storey Receipts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {billsData.length === 0 ? (
                  <div className="col-span-4 py-16 text-center border-2 border-dashed border-white/10 rounded-[2rem]">
                    <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">No financial documents logged</p>
                  </div>
                ) : (
                  billsData.map((bill, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBillPhoto(bill.photo)}
                      className="group relative h-36 rounded-2xl overflow-hidden border-2 border-white/5 hover:border-blue-500 transition-all shadow-lg active:scale-95"
                    >
                      <img src={bill.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                        <p className="text-[10px] font-black text-white uppercase truncate">{bill.name}</p>
                        <p className="text-[8px] font-bold text-blue-400 uppercase mt-1 tracking-widest flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> View Ledger Record
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Overlay for Photos */}
        {selectedBillPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-10 animate-in fade-in duration-300">
            <button
              onClick={() => setSelectedBillPhoto(null)}
              className="absolute top-10 right-10 p-5 bg-white/5 text-white rounded-full hover:bg-white/20 transition-all border border-white/10 hover:rotate-90"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="max-w-6xl max-h-[85vh] w-full flex flex-col items-center">
              <img src={selectedBillPhoto} className="max-w-full max-h-full rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5 object-contain" />
              <div className="mt-10 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-white font-black uppercase text-[10px] tracking-[0.3em] opacity-80">
                  <Zap className="w-3 h-3 inline mr-2 text-blue-400" />
                  SECURE BILLING LEDGER RECORD • ENCRYPTED AUDIT ACCESS
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white">Owner Dashboard</h1>
            <p className="text-slate-300 font-medium">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Profile />
            <button
              onClick={() => {
                logout();
                onLogout();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Render Details View if a project is selected for viewing */}
        {viewingProjectCode ? renderDetailedProject() : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="mb-8 p-5 bg-red-500/10 border-2 border-red-500/50 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-black uppercase text-[10px] tracking-widest mb-1">System Notice</h4>
                  <p className="text-sm font-bold text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Top Toolbar: Open Code & Lookup Client */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Open Project By Access Code */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg ring-4 ring-blue-500/10">
                    <Copy className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Access Project Portal</h2>
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    placeholder="ENTER ACCESS CODE (E.G., ABC12345)"
                    className="flex-1 px-6 py-4 bg-white/10 rounded-2xl border border-white/20 text-white placeholder-slate-500 font-black outline-none focus:ring-4 focus:ring-blue-500/20 uppercase tracking-widest transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleOpenProject()}
                  />
                  <button
                    onClick={handleOpenProject}
                    disabled={lookupLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {lookupLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                    Open
                  </button>
                </div>
              </div>

              {/* Lookup Client By Personal Code */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg ring-4 ring-purple-500/10">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Lookup Client Database</h2>
                </div>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    placeholder="Enter client's personal ID code"
                    className="flex-1 px-6 py-4 bg-white/10 rounded-2xl border border-white/20 text-white placeholder-slate-500 font-black outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleLookupClient()}
                  />
                  <button
                    onClick={handleLookupClient}
                    disabled={lookupLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {lookupLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Lookup
                  </button>
                </div>
              </div>
            </div>

            {/* Client Lookup Result Card */}
            {lookupClient && (
              <div className="mb-12 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-3xl animate-in zoom-in-95 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-purple-500/20">
                      {lookupClient.name[0]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-1">{lookupClient.name}</h3>
                      <div className="flex gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <span>{lookupClient.email}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400">ID: {lookupClient.personal_code}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setLookupClient(null)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-slate-500 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Linked Projects Hub</p>
                  {lookupProjects.length === 0 ? (
                    <div className="py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center">
                      <p className="text-slate-500 font-bold italic">No active projects found for this client ID.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lookupProjects.map((p: any) => (
                        <div key={p.id} className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/5 transition-all flex justify-between items-center group">
                          <div onClick={() => loadDetailedProject(p.access_code)} className="cursor-pointer flex-1">
                            <div className="font-black text-white text-lg group-hover:text-blue-400 transition-colors">{p.name}</div>
                            <div className="text-slate-500 text-xs font-bold mt-1 line-clamp-1">{p.description}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <code className="text-[11px] font-black text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 tracking-widest uppercase">
                              {p.access_code}
                            </code>
                            <button
                              onClick={() => copyAccessCode(p.access_code)}
                              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all shadow-inner active:scale-90"
                            >
                              {copiedCode === p.access_code ? <span className="text-xs font-black">✓</span> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Projects Grid Headline */}
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                <h2 className="text-2xl font-black text-white">Your Project Portfolio</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                <span>Auto-Syncing Portal Data</span>
              </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[3rem] border border-white/10 border-dashed">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Authenticating Local Records...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-24 text-center border-dashed">
                <Settings className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-30" />
                <p className="text-slate-400 font-black text-lg max-w-xs mx-auto">No projects tracked yet. Connect a client to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all group overflow-hidden relative"
                  >
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <Zap className="w-32 h-32" />
                    </div>

                    {/* Project Header */}
                    <div className="mb-6 relative z-10">
                      <h3 className="text-2xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                      {project.description && (
                        <p className="text-slate-500 text-sm font-bold line-clamp-2">{project.description}</p>
                      )}
                    </div>

                    {/* Access Code Section */}
                    <div className="bg-slate-900/50 rounded-3xl p-6 mb-8 border border-white/5 shadow-inner relative z-10">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">
                        Project Authorization Code
                      </p>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 text-white font-black text-xl tracking-[0.2em] bg-blue-600/5 px-4 py-3 rounded-2xl border border-white/5 uppercase">
                          {project.access_code}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAccessCode(project.access_code);
                          }}
                          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all shadow-xl active:scale-90"
                        >
                          {copiedCode === project.access_code ? (
                            <span className="text-sm font-black">✓</span>
                          ) : (
                            <Copy className="w-5 h-5 text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Registered</p>
                        <p className="text-slate-200 font-bold text-sm">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Network Status</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <p className="text-emerald-400 font-black text-xs">Live Sync</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncSingleProjectToLocalStorage(project);
                          localStorage.setItem('buildwise_project_id', project.id);
                          localStorage.setItem('buildwise_current_project_code', project.access_code);
                          onSelectProject(project.id);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black transition-all hover:scale-[1.03] shadow-lg shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDetailedProject(project.access_code);
                        }}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black border border-white/10 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                        Portal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Start Guide */}
            <div className="mt-20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-md border border-white/10 rounded-[3rem] p-12">
              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl"><RefreshCw className="w-5 h-5" /></div>
                Unified Connectivity Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-4xl mb-4 bg-white/10 w-12 h-12 flex items-center justify-center rounded-2xl">1️⃣</div>
                  <p className="text-white font-black text-lg mb-2">Connect Client</p>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">Lookup client by their personal ID to link their historical projects to your dashboard.</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-4xl mb-4 bg-white/10 w-12 h-12 flex items-center justify-center rounded-2xl">2️⃣</div>
                  <p className="text-white font-black text-lg mb-2">Sync Access Code</p>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">Share the unique Project Code with the client. It binds all their updates to a single secure vault.</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-4xl mb-4 bg-white/10 w-12 h-12 flex items-center justify-center rounded-2xl">3️⃣</div>
                  <p className="text-white font-black text-lg mb-2">Monitor Vault</p>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">Click "Portal" on any project to view exactly what the client sees in real-time transparency.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;