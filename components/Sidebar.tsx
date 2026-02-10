
import * as React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, Construction, Clock, Calculator, ListChecks, Users, Hammer, Package, Briefcase, Box, ClipboardList, CreditCard, Eye, Zap, X } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Control Center', icon: LayoutDashboard },
    { id: AppView.SCENARIO_1, label: 'Calculator', icon: Calculator },
    { id: AppView.SCENARIO_3, label: 'Intelligence Hub', icon: Zap },
    { id: AppView.SCENARIO_2, label: 'Time Optimization', icon: Clock },
    { id: AppView.SCENARIO_4, label: 'Phasing & Schedule', icon: ListChecks },
    { id: AppView.MATERIALS, label: 'Materials', icon: Package },
    { id: AppView.WORKERS, label: 'Workforce Hub', icon: Users },
    { id: AppView.DAILY_WORK_UPDATE, label: 'Daily Work Update', icon: Briefcase },
    { id: AppView.TASK_ASSIGNMENT, label: 'Task Assignment', icon: ClipboardList },
    { id: AppView.BUDGET_TRACKING, label: 'Budget Tracking', icon: CreditCard },
    { id: AppView.BLUEPRINT_3D, label: '3D Spatial Projection', icon: Box },
    { id: AppView.OWNER_PORTAL, label: 'Owner Portal', icon: Eye },
  ];

  return (
    <>
      {/* Overlay for mobile/toggled view */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20"
          onClick={onClose}
        />
      )}

      <aside className={`w-64 bg-slate-950 text-white min-h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/5`}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Construction className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">Build<span className="text-orange-500">Wise</span></h1>
              <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest opacity-80">AI PLATFORM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-500 hover:text-white" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === item.id
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg ring-4 ring-orange-500/20 scale-[1.02]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${currentView === item.id ? 'text-white' : 'group-hover:text-orange-400'}`} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/40 text-center">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Engine Status</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <p className="text-xs text-emerald-400 font-bold tracking-tighter uppercase">Groq Llama 3.3 Ready</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
