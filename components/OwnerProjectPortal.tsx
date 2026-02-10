
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Search,
    ExternalLink,
    Clock,
    Users,
    FileText,
    Image as ImageIcon,
    ChevronRight,
    Calendar,
    DollarSign,
    AlertCircle,
    X,
    Eye,
    Copy
} from 'lucide-react';
import { getWorkEntries } from '../services/supabaseClient';
import { INITIAL_WORKERS } from '../constants';
import { ProjectDataSync } from '../services/dataSync';

interface ProjectPortalProps {
    onClose?: () => void;
}

const OwnerProjectPortal: React.FC<ProjectPortalProps> = ({ onClose }) => {
    const [projectCode, setProjectCode] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [dailyUpdates, setDailyUpdates] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [estimatedTime, setEstimatedTime] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [selectedBillPhoto, setSelectedBillPhoto] = useState<string | null>(null);

    // Auto-load if we have a pre-set code (e.g., from Dashboard)
    useEffect(() => {
        const preSetCode = localStorage.getItem('buildwise_current_project_code_vault');
        if (preSetCode) {
            setProjectCode(preSetCode);
            localStorage.removeItem('buildwise_current_project_code_vault');

            // Wait for state to update
            setTimeout(() => {
                handleOpenProjectBase(preSetCode);
            }, 100);
        }
    }, []);

    const handleOpenProjectBase = async (code: string) => {
        if (!code.trim()) return;

        setLoading(true);
        setError(null);
        const normalizedCode = code.trim().toUpperCase();

        // MASTER DEMO CODE HANDLING
        if (normalizedCode === 'BW-MASTER-2026') {
            console.log("BW-DEBUG: Master Demo Code Activated");
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

                setWorkers(INITIAL_WORKERS.concat([
                    { id: '5', name: 'Alok Kumar', role: 'Carpenter' as any, dailyWage: 950, attendance: [] },
                    { id: '6', name: 'Rajesh Varma', role: 'Steel Worker' as any, dailyWage: 850, attendance: [] }
                ]));

                setEstimatedTime({ days: 145, weeks: 21, months: 5 });

                setBills([
                    { name: "Cement Invoice #991", photo: "https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=400&q=80", date: "2026-02-01" },
                    { name: "Steel Supply Order", photo: "https://images.unsplash.com/photo-1518381328518-d0ad33244851?auto=format&fit=crop&w=400&q=80", date: "2026-02-03" },
                    { name: "Electrical Fittings", photo: "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&w=400&q=80", date: "2026-02-04" }
                ]);

                setShowDetails(true);
                setLoading(false);
            }, 800);
            return;
        }

        console.log("BW-DEBUG: Opening Project Vault for:", normalizedCode);

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
                // Filter by project code
                updates = allUpdates.filter((u: any) =>
                    u.project_code?.toUpperCase() === normalizedCode ||
                    u.projectCode?.toUpperCase() === normalizedCode
                );
            } catch (e) {
                console.warn("BW-DEBUG: Supabase failed, using LocalStorage");
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

            // Fallback to initial workers if none found for project
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
                    } else {
                        // Look for any scenario that might have a timeline
                        const globalResult = results['global'];
                        if (globalResult?.timeline) time = globalResult.timeline;
                    }
                }
            }

            // Fetch Bills filtered by project code
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

            // Final validation before showing
            if (updates.length === 0 && projectWorkers.length === 0 && !time && billPhotos.length === 0 && !matchingProject) {
                setError(`Project code "${code}" not found or has no data yet. Use "BW-MASTER-2026" for a demo.`);
                setLoading(false);
                return;
            }

            setDailyUpdates(updates);
            setWorkers(finalWorkers);
            setEstimatedTime(time);
            setBills(billPhotos);
            setShowDetails(true);
        } catch (err: any) {
            console.error("BW-DEBUG: Portal Error:", err);
            setError(err.message || 'Failed to open project portal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProject = async () => {
        if (!projectCode.trim()) {
            setError('Please enter a project code');
            return;
        }
        await handleOpenProjectBase(projectCode);
    };

    if (!showDetails) {
        return (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-indigo-50">
                        <Search className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Owner Project Portal</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Cross-Reference Client Data</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Authorized Project Code</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={projectCode}
                                onChange={(e) => {
                                    setProjectCode(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleOpenProject();
                                    }
                                }}
                                placeholder="Enter unique project ID (e.g. BW-8819)"
                                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none font-black text-lg group-hover:bg-white group-hover:border-slate-200"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                                <ExternalLink className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium pl-1">
                            Tip: Use the unique code provided by your contractor
                        </p>
                    </div>

                    <button
                        onClick={handleOpenProject}
                        disabled={loading || !projectCode.trim()}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Eye className="w-5 h-5" />
                                <span>OPEN PROJECT VAULT</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
            {/* Header with Exit */}
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-xl text-white">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Project: {projectCode}</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Client Transparency Portal</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowDetails(false);
                        setProjectCode('');
                        setError(null);
                    }}
                    className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Updates Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full max-h-[800px] overflow-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Daily Work Stream</h3>
                        </div>

                        <div className="space-y-6">
                            {dailyUpdates.length === 0 ? (
                                <p className="text-center py-10 text-slate-400 font-bold text-xs italic">No updates logged yet.</p>
                            ) : (
                                dailyUpdates.map((update, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-slate-100 pb-6 group hover:border-blue-400 transition-all">
                                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-200 group-hover:bg-blue-500 border-4 border-white transition-all" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{new Date(update.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">{update.description}</p>
                                        {update.photos && update.photos.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {update.photos.map((p: any, idx: number) => (
                                                    <img key={idx} src={p.dataUrl} className="w-16 h-16 rounded-lg object-cover border border-slate-200" title={p.name} />
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
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                            <Users className="absolute right-[-20px] top-[-20px] w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Workforce Deployed</h4>
                            <p className="text-5xl font-black mb-2">{workers.length}</p>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(workers.map(w => w.role))).slice(0, 3).map((r, i) => (
                                    <span key={i} className="px-2 py-1 bg-white/20 rounded-md text-[9px] font-black uppercase backdrop-blur-md">{r}</span>
                                ))}
                                {workers.length > 3 && <span className="text-[9px] font-black uppercase opacity-60">+{workers.length - 3} More</span>}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <Clock className="absolute right-[-20px] top-[-20px] w-40 h-40 opacity-5 group-hover:scale-110 transition-transform text-slate-900" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Timeline</h4>
                            <p className="text-5xl font-black text-slate-900 mb-2">{estimatedTime?.days || '--'} <span className="text-xl">Days</span></p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span>On-Track for {estimatedTime?.weeks || '--'} Weeks</span>
                            </div>
                        </div>
                    </div>

                    {/* Workers Grid */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Active Site Personnel</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workers.slice(0, 6).map((w, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">{w.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{w.role}</p>
                                    </div>
                                    <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-indigo-600">₹{w.dailyWage}</p>
                                    </div>
                                </div>
                            ))}
                            {workers.length > 6 && (
                                <div className="md:col-span-2 text-center py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    + {workers.length - 6} additional records in workforce hub
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bills Gallery */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 text-white rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-white uppercase text-xs tracking-widest">Financial Document Vault</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actual Material Bills</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {bills.length === 0 ? (
                                <div className="col-span-4 py-10 text-center border-2 border-dashed border-white/10 rounded-3xl">
                                    <p className="text-white/40 font-bold text-xs">No billing documents uploaded yet.</p>
                                </div>
                            ) : (
                                bills.map((bill, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedBillPhoto(bill.photo)}
                                        className="group relative h-32 rounded-2xl overflow-hidden border-2 border-white/5 hover:border-indigo-500 transition-all"
                                    >
                                        <img src={bill.photo} className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                                            <p className="text-[9px] font-black text-white uppercase truncate">{bill.name}</p>
                                            <p className="text-[8px] font-bold text-blue-300 uppercase mt-0.5">Click to Inspect</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Overlay Modal */}
            {selectedBillPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-10 animate-in fade-in duration-300">
                    <button
                        onClick={() => setSelectedBillPhoto(null)}
                        className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="max-w-5xl max-h-[85vh] w-full flex flex-col items-center">
                        <img src={selectedBillPhoto} className="max-w-full max-h-full rounded-3xl shadow-2xl border-4 border-white/10 object-contain" />
                        <p className="mt-8 text-white font-black uppercase text-xs tracking-[0.2em] opacity-60 italic">Official Material Billing Record • Encrypted Access</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerProjectPortal;