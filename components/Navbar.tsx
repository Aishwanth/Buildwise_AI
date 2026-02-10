
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Construction, Menu, Zap } from 'lucide-react';
import { AppView } from '../types';
import { getProjectById } from '../services/authService';
import Profile from './Profile';

interface NavbarProps {
  setView: (view: AppView) => void;
  onToggleSidebar: () => void;
  currentView: AppView;
}

const Navbar: React.FC<NavbarProps> = ({ setView, onToggleSidebar, currentView }) => {
  const getBtnStyle = (view: AppView) => {
    const isActive = currentView === view;
    return `px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${isActive
      ? 'bg-white text-orange-600 shadow-lg ring-4 ring-white/20 scale-105'
      : 'text-white hover:bg-white/10 hover:scale-105 active:scale-95'
      }`;
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-lg w-full border-b border-white/5">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
          <Construction className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold tracking-tight">BuildWise <span className="text-orange-500 italic">AI Pro</span></span>
        </div>
      </div>
      <div className="flex gap-4 text-sm font-medium items-center">
        <button onClick={() => setView(AppView.DASHBOARD)} className={getBtnStyle(AppView.DASHBOARD)}>Home</button>
        <button onClick={() => setView(AppView.SCENARIO_1)} className={getBtnStyle(AppView.SCENARIO_1)}>Calculator</button>
        <button
          onClick={() => setView(AppView.SCENARIO_3)}
          className={getBtnStyle(AppView.SCENARIO_3)}
        >
          <Zap className={`w-4 h-4 ${currentView === AppView.SCENARIO_3 ? 'text-orange-600' : 'text-amber-300'}`} />
          Intelligence Hub
        </button>
        <button onClick={() => setView(AppView.TASK_ASSIGNMENT)} className={getBtnStyle(AppView.TASK_ASSIGNMENT)}>Tasks</button>
        <button onClick={() => setView(AppView.BUDGET_TRACKING)} className={getBtnStyle(AppView.BUDGET_TRACKING)}>Budget</button>
        <ProjectCodeDisplay />
        <Profile />
      </div>
    </nav>
  );
};

const ProjectCodeDisplay: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const projectId = localStorage.getItem('buildwise_project_id');
    if (!projectId) return;
    let mounted = true;
    (async () => {
      try {
        const project = await getProjectById(projectId);
        if (mounted && project?.access_code) setCode(project.access_code);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!code) return null;
  return (
    <div className="ml-4 bg-white/10 px-3 py-2 rounded-lg text-sm font-black tracking-wider">
      Code: {code}
    </div>
  );
};

export default Navbar;
