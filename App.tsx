
import * as React from 'react';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AttendanceCalendar from './components/AttendanceCalendar';
import SafetyCheck from './components/SafetyCheck';
import Materials from './components/Materials';
import DailyWorkUpdate from './components/DailyWorkUpdate';
import Blueprint3D from './components/Blueprint3D';
import TimelineOptimization from './components/TimelineOptimization';
import ProjectIntelligence from './components/ProjectIntelligence';
import TaskAssignment from './components/TaskAssignment';
import BudgetTracking from './components/BudgetTracking';
import ChatBot from './components/ChatBot';
import OwnerProjectPortal from './components/OwnerProjectPortal';
import { AppView, Worker, AIPlanningResult } from './types';
import { ProjectDataSync } from './services/dataSync';
import { useAuth } from './context/AuthContext';
import { INITIAL_WORKERS, ROLES } from './constants';
import { analyzeConstructionScenario } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import {
  Loader2, Plus, Trash2, Calendar, Construction,
  Clock, Users, Ruler, Timer, CreditCard, Layers,
  ChevronRight, Calculator, Edit3, X, Save, Shield, Box, Zap,
  ClipboardList, AlertTriangle, MessageCircle, Eye, ShieldCheck, CheckCircle,
  Folder, Upload
} from 'lucide-react';

const BudgetQuickStatus: React.FC<{ initialState?: AIPlanningResult }> = ({ initialState }) => {
  if (!initialState) return null;

  const planned = initialState.costBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const savedMaterials = localStorage.getItem('buildwise_materials_actual');
  const materialsData = savedMaterials ? JSON.parse(savedMaterials) : [];
  const actual = materialsData.reduce((sum: number, m: any) => sum + (m.quantity * m.cost_per_unit || m.costPerUnit), 0) || (planned * 0.8);

  const percentage = (actual / planned) * 100;

  if (percentage < 85) return null;

  return (
    <div className={`p-6 rounded-[2rem] text-white flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500 ${percentage >= 100 ? 'bg-red-600' : 'bg-amber-500'
      }`}>
      <div className="flex items-center gap-4">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <h4 className="font-black text-sm uppercase tracking-tight">
            {percentage >= 100 ? '❌ Budget Exceeded' : '⚠ Budget Alert'}
          </h4>
          <p className="text-xs font-bold opacity-80">
            {percentage >= 100 ? `Real-time spending has crossed the planned ₹${planned.toLocaleString()} baseline.` : `Spending is approaching the limit (${percentage.toFixed(0)}%).`}
          </p>
        </div>
      </div>
      <div className="bg-black/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
        {percentage >= 100 ? `Deficit: ₹${(actual - planned).toLocaleString()}` : `Limit: ₹${planned.toLocaleString()}`}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, projectId, setProjectId } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [projectCode, setProjectCode] = useState<string>(ProjectDataSync.getCurrentProjectCode() || 'global');
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [safetyVerified, setSafetyVerified] = useState<Record<string, boolean>>({}); // New safety state
  const [archiveTab, setArchiveTab] = useState<'documents' | 'photos'>('documents');

  // Persistence for Workers - Triggered by worker state OR project code change
  React.useEffect(() => {
    const projectWorkers = ProjectDataSync.getProjectWorkers();
    setWorkers(projectWorkers.length > 0 ? projectWorkers : INITIAL_WORKERS);
  }, [projectCode]);

  React.useEffect(() => {
    // Only save if we have actual workers to avoid overwriting with initial state on switch
    if (workers.length > 0) {
      ProjectDataSync.saveWorkers(workers);
    }
  }, [workers]);

  const [loading, setLoading] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<Partial<Record<AppView, AIPlanningResult>>>({});

  // Persistence Hook for Scenario Results
  React.useEffect(() => {
    const saved = localStorage.getItem('buildwise_scenario_results');
    if (saved) {
      const results = JSON.parse(saved);
      const code = ProjectDataSync.getCurrentProjectCode() || 'global';
      if (results[code]) {
        setScenarioResults(results[code].results || {});
      } else {
        setScenarioResults(results.global || {});
      }
    }
  }, [projectCode]);

  React.useEffect(() => {
    if (Object.keys(scenarioResults).length > 0) {
      const code = ProjectDataSync.getCurrentProjectCode() || 'global';
      const stored = localStorage.getItem('buildwise_scenario_results');
      const allResults = stored ? JSON.parse(stored) : {};

      allResults[code] = {
        results: scenarioResults,
        projectCode: code,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('buildwise_scenario_results', JSON.stringify(allResults));
    }
  }, [scenarioResults]);

  // Modals / Selection state
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedWorkerForSafety, setSelectedWorkerForSafety] = useState<string | null>(null);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  // Form States for analysis
  const [area, setArea] = useState('1000');
  const [floors, setFloors] = useState('G+2');
  const [targetDays, setTargetDays] = useState('90');
  const [dailyWage, setDailyWage] = useState('600');
  const [projectType, setProjectType] = useState('Residential');

  // Persistence Hook for Form Inputs (Isolated by user)
  React.useEffect(() => {
    if (!user) return;
    const key = `buildwise_${user.id}_inputs`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setArea(parsed.area || '1000');
      setFloors(parsed.floors || 'G+2');
      setTargetDays(parsed.targetDays || '90');
      setDailyWage(parsed.dailyWage || '600');
      setProjectType(parsed.projectType || 'Residential');
    }
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const key = `buildwise_${user.id}_inputs`;
    localStorage.setItem(key, JSON.stringify({ area, floors, targetDays, dailyWage, projectType }));
  }, [area, floors, targetDays, dailyWage, projectType, user]);

  // Handle custom view switching events (from components)
  React.useEffect(() => {
    const handleSwitchView = (e: any) => {
      if (e.detail) {
        handleViewChange(e.detail as AppView);
      }
    };
    window.addEventListener('switch-view', handleSwitchView);
    return () => window.removeEventListener('switch-view', handleSwitchView);
  }, []);

  // Data Migration for multi-project support
  React.useEffect(() => {
    ProjectDataSync.migrateExistingData();
    // ProjectDataSync.debugProjectData(); // Uncomment to debug in console
  }, []);

  // Form states for adding/editing workers
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState<Worker['role']>('Mason');
  const [newWorkerWage, setNewWorkerWage] = useState('600');

  const handleViewChange = (view: AppView) => {
    setLoading(false);
    setCurrentView(view);
    // Refresh project code in case it was changed in localStorage (e.g. by Navbar)
    setProjectCode(ProjectDataSync.getCurrentProjectCode() || 'global');
  };

  const handleAIAnalysis = async (scenario: AppView) => {
    setLoading(true);
    // Removed stale setAiResult(null)
    try {
      let prompt = '';
      switch (scenario) {
        case AppView.SCENARIO_1:
          prompt = `Plan a ${projectType} ${floors} building of ${area} sq. yards. 
          CALCULATION RULE: Use ₹14,400-17,100 per sq yard for Residential and ₹19,800-25,200 per sq yard for Commercial.
          Provide: Worker requirements (masons, helpers, steel workers, carpenters, supervisors), Total labour days, Timeline (days/weeks/months), Cost breakdown (labor, materials, overhead), Material requirements, and an architectural blueprint.`;
          break;
        case AppView.SCENARIO_2:
          prompt = `Timeline Planning: Complete a ${area} sq. yard ${projectType} project in ${targetDays} days. Calculate required workforce for this compressed schedule, adjust material quantities, show cost implications, and generate a weekly construction schedule with resource intensity.`;
          break;
        case AppView.SCENARIO_4:
          prompt = `Comprehensive Construction Schedule: Week-by-week plan for a ${area} sq. yard ${projectType} project including finishing. Include Foundation to handover timeline, all phases from site prep to electrical/plumbing/painting, activity dependencies, and resource allocation per phase.`;
          break;
        case AppView.SCENARIO_3:
          prompt = `Budget & Cost Analysis: Detailed cost for a ${area} sq. yard, ${floors} ${projectType} building with worker wage ₹${dailyWage}. 
          CALCULATION RULE: Use ₹14,400-17,100 per sq yard for Residential and ₹19,800-25,200 per sq yard for Commercial.
          Provide labor/material/overhead breakdown, cost per sq. yard analysis, and contingency calculations.`;
          break;
      }

      const result = await analyzeConstructionScenario(prompt);
      setScenarioResults(prev => ({ ...prev, [scenario]: result }));
    } catch (error) {
      alert("Analysis failed. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (workerId: string, day: number) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        const newAtt = [...w.attendance];
        newAtt[day] = !newAtt[day];
        return { ...w, attendance: newAtt };
      }
      return w;
    }));
  };

  const addWorker = () => {
    if (!newWorkerName) return;
    const newWorker: Worker = {
      id: Date.now().toString(),
      name: newWorkerName,
      role: newWorkerRole,
      dailyWage: parseInt(newWorkerWage),
      attendance: new Array(30).fill(false)
    };

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    // Force sync to storage immediately
    ProjectDataSync.saveWorkers(updatedWorkers);

    setNewWorkerName('');
    setIsAddingWorker(false);
  };

  const deleteWorker = (id: string) => {
    if (confirm("Are you sure you want to remove this worker from the project?")) {
      setWorkers(workers.filter(w => w.id !== id));
    }
  };

  const updateWorker = (id: string) => {
    setWorkers(workers.map(w => {
      if (w.id === id) {
        return { ...w, name: newWorkerName, role: newWorkerRole, dailyWage: parseInt(newWorkerWage) };
      }
      return w;
    }));
    setEditingWorkerId(null);
    setNewWorkerName('');
  };

  const startEditWorker = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setNewWorkerName(worker.name);
    setNewWorkerRole(worker.role);
    setNewWorkerWage(worker.dailyWage.toString());
  };

  const renderWorkerModal = () => {
    const isEditing = !!editingWorkerId;
    if (!isAddingWorker && !isEditing) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">{isEditing ? 'Update Personnel' : 'Register Personnel'}</h3>
            <button onClick={() => { setIsAddingWorker(false); setEditingWorkerId(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Full Name</label>
              <input
                value={newWorkerName}
                onChange={e => setNewWorkerName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Project Role</label>
              <select
                value={newWorkerRole}
                onChange={e => setNewWorkerRole(e.target.value as Worker['role'])}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none"
              >
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Daily Wage (₹)</label>
              <input
                type="number"
                value={newWorkerWage}
                onChange={e => setNewWorkerWage(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>

            <button
              onClick={() => isEditing ? updateWorker(editingWorkerId!) : addWorker()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 mt-4 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Save Changes' : 'Register Worker'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisContainer = (title: string, Icon: any, scenario: AppView, inputs: React.ReactNode) => (
    <div key={scenario} className="flex flex-col lg:flex-row gap-8 w-full relative">
      <div className="w-full lg:w-1/3">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 text-xl">{title}</h3>
          </div>
          <div className="space-y-6">{inputs}</div>
          <button
            onClick={() => handleAIAnalysis(scenario)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-2 mt-8"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run AI Analysis'}
          </button>
        </div>
      </div>
      <div className="w-full lg:w-2/3 min-h-[500px]">
        {loading ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 mb-2">Buildwise AI Thinking...</h4>
            <p className="text-slate-400 max-w-sm">Generating custom structural projections and resource distribution for your project.</p>
          </div>
        ) : scenarioResults[scenario] ? (
          <ResultDisplay
            result={scenarioResults[scenario]!}
            onView3D={() => setCurrentView(AppView.BLUEPRINT_3D)}
            mode={
              scenario === AppView.SCENARIO_4 ? 'phasing' :
                scenario === AppView.SCENARIO_1 ? 'calculator' : 'full'
            }
          />
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[2.5rem] flex flex-col items-center text-center">
            <div className="p-6 bg-slate-50 rounded-3xl mb-6">
              <Construction className="w-12 h-12 text-slate-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-400">Ready for Insights</h4>
            <p className="text-slate-400 max-w-sm">Adjust project parameters and click analyze to see detailed predictions.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCalculator = () => renderAnalysisContainer(
    "Project Calculator", Ruler, AppView.SCENARIO_1,
    <>
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Project Area (Sq. Yards)</label>
        <input type="number" value={area} onChange={e => setArea(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Number of Floors</label>
        <input type="text" value={floors} onChange={e => setFloors(e.target.value)} placeholder="G+2" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Project Type</label>
        <select value={projectType} onChange={e => setProjectType(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none">
          <option>Residential</option>
          <option>Commercial</option>
          <option>Industrial</option>
        </select>
      </div>
    </>
  );

  const renderTimeOptimization = () => <TimelineOptimization />;

  const handleSafetyUpdate = (workerId: string, safetyChecks: any) => {
    // Update worker with safety check records
    setWorkers(workers.map(w => {
      if (w.id === workerId) {
        return { ...w, safetyChecks };
      }
      return w;
    }));

    // Unlock the attendance button by setting safety verified to true
    setSafetyVerified(prev => ({ ...prev, [workerId]: true }));

    // Close safety modal and OPEN attendance modal for seamless flow
    setSelectedWorkerForSafety(null);
    setSelectedWorkerId(workerId);
  };

  const renderPhasingSchedule = () => renderAnalysisContainer(
    "Execution Planner", Layers, AppView.SCENARIO_4,
    <>
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Project Area (Sq. Yards)</label>
        <input type="number" value={area} onChange={e => setArea(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Number of Floors</label>
        <input type="text" value={floors} onChange={e => setFloors(e.target.value)} placeholder="G+2" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
      </div>
    </>
  );

  const renderWorkerHub = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-3xl border border-slate-200 shadow-sm gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800">Workforce Hub</h2>
            <p className="text-slate-500 font-medium">Personnel Management & Payroll Tracking</p>
          </div>
          <button
            onClick={() => { setIsAddingWorker(true); setNewWorkerName(''); setNewWorkerWage('600'); }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Personnel
          </button>
        </div>

        {/* Safety Verification Section for Workforce Hub */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mark Attendance</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Rate</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workers.map((worker) => {
                  const daysPresent = worker.attendance.filter(a => a).length;
                  const monthlySalary = daysPresent * worker.dailyWage;
                  return (
                    <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                            {worker.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">{worker.name}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedWorkerId(worker.id)}
                            disabled={!safetyVerified[worker.id]}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${safetyVerified[worker.id]
                              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            title={!safetyVerified[worker.id] ? "Complete Safety Check First" : "Mark Attendance"}
                          >
                            <Calendar className="w-4 h-4" />
                            Mark Attendance
                          </button>

                          {/* Safety Status Icon */}
                          <button
                            onClick={() => setSelectedWorkerForSafety(worker.id)}
                            className={`p-2 rounded-lg border transition-all hover:scale-110 active:scale-95 ${safetyVerified[worker.id]
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-500 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                              }`}
                            title={safetyVerified[worker.id] ? "Safety Verified" : "Click to Verify Safety"}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-bold text-slate-500">₹{worker.dailyWage}</td>
                      <td className="px-10 py-6">
                        <div className="text-indigo-600 font-black text-lg">₹{monthlySalary.toLocaleString()}</div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedWorkerForSafety(worker.id)}
                            className="p-2.5 text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-110"
                            title="Safety Check"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => startEditWorker(worker)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteWorker(worker.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Total Estimated Payroll</p>
              <p className="text-3xl font-black">₹{workers.reduce((acc, w) => acc + (w.attendance.filter(a => a).length * w.dailyWage), 0).toLocaleString()}</p>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all">Finalize & Pay</button>
          </div>
        </div>

        {/* Digital Site Archive (Documents & Photos) - ADDED FOR CONTINUITY */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 mt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <Folder className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Digital Site Archive</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setArchiveTab('documents')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${archiveTab === 'documents' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Documents
              </button>
              <button
                onClick={() => setArchiveTab('photos')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${archiveTab === 'photos' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Progress Photos
              </button>
            </div>
          </div>

          {archiveTab === 'documents' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-slate-800 font-bold text-sm mb-1">Upload Site Documents</p>
                <p className="text-slate-400 text-xs">PDF, DOCX, XLSX (Max 50MB)</p>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Structural_Audit_Report_v2.pdf', size: '2.4 MB', date: 'Today, 10:30 AM', type: 'PDF' },
                  { name: 'Material_Procurement_List_Nov.xlsx', size: '850 KB', date: 'Yesterday', type: 'XLSX' },
                  { name: 'Safety_Compliance_Checklist.docx', size: '1.2 MB', date: 'Nov 12, 2025', type: 'DOC' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white border border-slate-100 rounded-lg text-slate-500 font-black text-[10px] uppercase shadow-sm">
                        {doc.type}
                      </div>
                      <div>
                        <p className="text-slate-800 font-bold text-sm group-hover:text-blue-600 transition-colors">{doc.name}</p>
                        <p className="text-slate-400 text-xs">{doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-all cursor-pointer group">
                <Upload className="w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-slate-400 text-xs font-bold">Add Photo</p>
              </div>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative group">
                  <img src={`https://source.unsplash.com/random/400x400?construction,building&sig=${i}`} alt="Progress" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs font-black uppercase tracking-widest">View</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-10">
      <div className="bg-gradient-to-r from-amber-600/90 to-orange-700/90 backdrop-blur-md p-6 rounded-[1.5rem] text-white relative overflow-hidden shadow-2xl min-h-[180px] flex items-center border border-white/10 max-w-4xl">
        <div className="relative z-10 max-w-lg text-left pl-6">
          <h2 className="text-3xl font-black mb-2 leading-tight tracking-tight text-white uppercase italic">Construction<br />Intelligence.</h2>
          <p className="text-orange-50 text-xs font-medium mb-5 opacity-90 max-w-sm">Maximize building efficiency with data-driven planning and workforce management.</p>
          <div className="flex gap-4">
            <button onClick={() => handleViewChange(AppView.SCENARIO_1)} className="bg-white text-orange-700 px-5 py-2 rounded-lg font-black shadow-lg hover:bg-orange-50 transition-all text-xs">Launch Tools</button>
            <button onClick={() => handleViewChange(AppView.WORKERS)} className="bg-white/20 text-white border border-white/40 px-5 py-2 rounded-lg font-black backdrop-blur-md hover:bg-white/30 transition-all text-xs">Manage Hub</button>
          </div>
        </div>
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none select-none mix-blend-overlay">
          <div className="text-[20rem] font-black transform rotate-12">AI</div>
        </div>
      </div>

      {/* Real-time Budget Status Banner - Dashboard Only */}
      <BudgetQuickStatus initialState={scenarioResults[AppView.SCENARIO_1]} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: AppView.SCENARIO_1, title: 'Calculator', icon: Ruler, description: 'Project scale and material estimates' },
          { id: AppView.SCENARIO_2, title: 'Optimization', icon: Timer, description: 'Timeline and resource leveling' },
          { id: AppView.SCENARIO_3, title: 'Intelligence Hub', icon: Zap, description: 'Interconnected Risk & What-If Simulations' },
          { id: AppView.SCENARIO_4, title: 'Phasing', icon: Layers, description: 'Step-by-step execution planner' },
          { id: AppView.TASK_ASSIGNMENT, title: 'Tasks', icon: ClipboardList, description: 'Delegate and track activities' },
          { id: AppView.BUDGET_TRACKING, title: 'Budget', icon: CreditCard, description: 'Planned vs Actual expenditure' },
          { id: AppView.WORKERS, title: 'Workforce', icon: Users, description: 'Personnel and payroll portal' },
          { id: AppView.BLUEPRINT_3D, title: '3D Spatial', icon: Box, description: 'Convert blueprints to immersive 3D' },
          { id: AppView.OWNER_PORTAL, title: 'Owner Portal', icon: Eye, description: 'Cross-reference client project data' }
        ].map((feat, index) => (
          <button
            key={feat.id}
            onClick={() => handleViewChange(feat.id)}
            style={{ animationDelay: `${index * 100}ms` }}
            className="group bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-400 transition-all text-left feature-transition opacity-0"
          >
            <div className={`w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 group-hover:text-white transition-all shadow-sm`}>
              <feat.icon className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-800 mb-2">{feat.title}</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{feat.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  const getBackgroundStyle = () => {
    // Brighter, cleaner overlay for a "Bright Theme"
    const baseOverlay = 'linear-gradient(rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.9))';

    const bgMap: Record<AppView, string> = {
      [AppView.DASHBOARD]: `url("/home2img.jpeg")`,
      [AppView.SCENARIO_1]: `url("/calculati img.jpeg")`,
      [AppView.SCENARIO_2]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-timeline.svg")`,
      [AppView.SCENARIO_3]: `url("/calculati img.jpeg")`, // Intelligence Hub
      [AppView.SCENARIO_4]: `url("/phassing.jpeg")`,
      [AppView.MATERIALS]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-materials.svg")`,
      [AppView.WORKERS]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-workers.svg")`,
      [AppView.DAILY_WORK_UPDATE]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-daily-work.svg")`,
      [AppView.BLUEPRINT_3D]: `url("/phassing.jpeg")`,
      [AppView.TASK_ASSIGNMENT]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-tasks.svg")`,
      [AppView.BUDGET_TRACKING]: `url("/phassing.jpeg")`,
      [AppView.OWNER_PORTAL]: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg-vault.svg")`,
    };

    const isFullImagePage = [
      AppView.DASHBOARD,
      AppView.SCENARIO_1,
      AppView.SCENARIO_3,
      AppView.SCENARIO_4,
      AppView.BLUEPRINT_3D,
      AppView.BUDGET_TRACKING
    ].includes(currentView);

    return {
      backgroundImage: bgMap[currentView] || `url("/home1.img.jpeg")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      // Dynamic overlay based on page type to maintain "Bright" look
      backgroundColor: 'white'
    };
  };

  return (
    <div className="min-h-screen flex font-sans overflow-x-hidden bg-slate-100 relative">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <style>{`
        @keyframes cinematicIn {
          from { 
            opacity: 0; 
            transform: scale(0.98) translateY(10px);
            filter: blur(5px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        /* Bright Theme adjustments */
        main::before {
          content: "";
          position: fixed;
          inset: 0;
          background: linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.9));
          backdrop-blur-[2px];
          z-index: -1;
        }
        .feature-transition {
          animation: cinematicIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <Sidebar
        currentView={currentView}
        setView={(view) => {
          handleViewChange(view);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 min-h-screen flex flex-col relative transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Navbar
          setView={handleViewChange}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentView={currentView}
        />
        <main
          className="flex-1 p-12 w-full relative overflow-hidden"
          style={getBackgroundStyle()}
        >
          <div
            key={currentView}
            className="max-w-[1400px] mx-auto w-full feature-transition"
          >
            {currentView === AppView.DASHBOARD && renderDashboard()}
            {currentView === AppView.SCENARIO_1 && renderCalculator()}
            {currentView === AppView.SCENARIO_2 && renderTimeOptimization()}
            {currentView === AppView.SCENARIO_4 && renderPhasingSchedule()}
            {currentView === AppView.MATERIALS && <Materials />}
            {currentView === AppView.WORKERS && renderWorkerHub()}
            {currentView === AppView.DAILY_WORK_UPDATE && <DailyWorkUpdate />}
            {currentView === AppView.TASK_ASSIGNMENT && <TaskAssignment />}
            {currentView === AppView.OWNER_PORTAL && <OwnerProjectPortal />}
            {currentView === AppView.BUDGET_TRACKING && <BudgetTracking initialState={scenarioResults[AppView.SCENARIO_1] || scenarioResults[AppView.SCENARIO_3]} />}
            {currentView === AppView.SCENARIO_3 && (
              scenarioResults[AppView.SCENARIO_3] || scenarioResults[AppView.SCENARIO_1] ? (
                <ProjectIntelligence
                  initialState={(scenarioResults[AppView.SCENARIO_3] || scenarioResults[AppView.SCENARIO_1])!}
                  onUpdate={(updated) => setScenarioResults(prev => ({ ...prev, [AppView.SCENARIO_3]: updated }))}
                />
              ) : (
                <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
                  <div className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl mb-8">
                    <Zap className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-4">No Project Active</h3>
                  <p className="text-slate-400 max-w-sm mb-10 font-bold">Please run the "Project Calculator" first to generate a baseline. The Intelligence Hub uses that baseline to simulate risks and scenarios.</p>
                  <button onClick={() => setCurrentView(AppView.SCENARIO_1)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs">Open Calculator</button>
                </div>
              )
            )}
            {currentView === AppView.BLUEPRINT_3D && <Blueprint3D blueprint={scenarioResults[AppView.SCENARIO_1]?.blueprint || scenarioResults[AppView.SCENARIO_4]?.blueprint} />}
          </div>
        </main>
      </div>

      {/* AI ChatBot Floating Interface */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
        >
          <MessageCircle className="w-8 h-8" />
          <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Ask BuildWise AI
          </div>
        </button>
      )}

      {renderWorkerModal()}

      {selectedWorker && (
        <AttendanceCalendar
          worker={selectedWorker}
          onClose={() => setSelectedWorkerId(null)}
          onToggleDate={(dayIndex) => toggleAttendance(selectedWorker.id, dayIndex)}
        />
      )}

      {selectedWorkerForSafety && workers.find(w => w.id === selectedWorkerForSafety) && (
        <SafetyCheck
          worker={workers.find(w => w.id === selectedWorkerForSafety)!}
          onClose={() => setSelectedWorkerForSafety(null)}
          onSafetyUpdate={handleSafetyUpdate}
        />
      )}
    </div>
  );
};

export default App;
