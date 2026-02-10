
import * as React from 'react';
import {
    TrendingDown,
    ShieldAlert,
    Zap,
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Clock,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    Construction
} from 'lucide-react';
import { Risk, Scenario, ProjectState, AIPlanningResult } from '../types';
import { ProjectDataSync } from '../services/dataSync';

interface ProjectIntelligenceProps {
    initialState: AIPlanningResult;
    onUpdate: (updated: AIPlanningResult) => void;
}

const ProjectIntelligence: React.FC<ProjectIntelligenceProps> = ({ initialState, onUpdate }) => {
    // 1. Core State
    const [area] = React.useState(initialState.blueprint?.totalAreaSqYards || 0);
    const [projectType] = React.useState('Residential');

    // 2. Risks & Scenarios State
    const [risks, setRisks] = React.useState<Risk[]>([]);
    const [activeScenarios, setActiveScenarios] = React.useState<string[]>([]);

    // Predefined Scenarios
    const scenarios: Scenario[] = [
        { id: 'shift', name: 'Double Shift', description: 'Add a night shift for faster completion', costModifier: 1.25, timeModifier: 0.6, riskModifier: 1.1 },
        { id: 'premium', name: 'Premium Materials', description: 'Faster installation but higher material cost', costModifier: 1.4, timeModifier: 0.85, riskModifier: 0.8 },
        { id: 'lean', name: 'Lean Management', description: 'Reduce waste and waiting time', costModifier: 0.95, timeModifier: 0.9, riskModifier: 0.95 },
    ];

    // 3. Calculation & Interconnection Logic
    const calculateMetrics = () => {
        let totalCost = initialState.costBreakdown.reduce((acc, c) => acc + c.amount, 0);
        let totalDays = initialState.timeline.days;
        let baseRiskScore = 15; // Base risk percentage

        // Apply Scenarios
        activeScenarios.forEach(sid => {
            const s = scenarios.find(sc => sc.id === sid);
            if (s) {
                totalCost *= s.costModifier;
                totalDays *= s.timeModifier;
                baseRiskScore *= s.riskModifier;
            }
        });

        // Apply Risks
        risks.forEach(r => {
            totalCost += r.impactCost * r.probability;
            totalDays += r.impactDays * r.probability;
            baseRiskScore += 5; // Each added risk increases uncertainty
        });

        return { totalCost, totalDays, riskScore: Math.min(baseRiskScore, 100) };
    };

    const metrics = calculateMetrics();

    // 4. Persistence
    const handleSave = () => {
        const data = {
            risks,
            activeScenarios,
            timestamp: new Date().toISOString(),
            metrics, // Store the calculated metrics too
            timeline: { days: metrics.totalDays, weeks: Math.round(metrics.totalDays / 7), months: Math.round(metrics.totalDays / 30) }
        };

        // Save to multi-project store
        ProjectDataSync.saveScenarioResult('Project Intelligence', data);

        localStorage.setItem('buildwise_intelligence', JSON.stringify(data));
        alert('Project configuration saved locally! (Interconnected metrics persisted)');
    };

    React.useEffect(() => {
        const saved = localStorage.getItem('buildwise_intelligence');
        if (saved) {
            const parsed = JSON.parse(saved);
            setRisks(parsed.risks || []);
            setActiveScenarios(parsed.activeScenarios || []);
        }
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Metrics Overview - The "Interconnected Hub" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Simulated Budget</h4>
                    <p className="text-4xl font-black text-indigo-600">₹{Math.round(metrics.totalCost).toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Interconnection Active</span>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Simulated Timeline</h4>
                    <p className="text-4xl font-black text-blue-600">{Math.round(metrics.totalDays)} Days</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">~{Math.round(metrics.totalDays / 30)} Months</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-24 h-24" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Combined Risk Factor</h4>
                    <p className="text-4xl font-black text-amber-500">{metrics.riskScore.toFixed(1)}%</p>
                    <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500"
                            style={{ width: `${metrics.riskScore}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module 1: What-If Scenario Simulator */}
                <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">What-If Simulator</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Toggle Scenarios</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {scenarios.map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setActiveScenarios(prev =>
                                        prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                    );
                                }}
                                className={`w-full p-6 rounded-2xl border transition-all text-left flex justify-between items-center ${activeScenarios.includes(s.id)
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }`}
                            >
                                <div>
                                    <h4 className="font-black mb-1">{s.name}</h4>
                                    <p className="text-[10px] font-bold opacity-60">{s.description}</p>
                                </div>
                                {activeScenarios.includes(s.id) && <CheckCircle2 className="w-6 h-6" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Module 2: Risk and Delay Calculator */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Risk Manager</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Risk Profile</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const newRisk: Risk = {
                                    id: Math.random().toString(),
                                    name: 'New Delay Factor',
                                    type: 'Weather',
                                    impactDays: 15,
                                    impactCost: 250000,
                                    probability: 0.5
                                };
                                setRisks([...risks, newRisk]);
                            }}
                            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Identify Risk
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                        {risks.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">No active risks identified.</p>
                            </div>
                        ) : (
                            risks.map(r => (
                                <div key={r.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                                    <button
                                        onClick={() => setRisks(risks.filter(risk => risk.id !== r.id))}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-black text-slate-800 text-sm uppercase">{r.name}</h4>
                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-black uppercase">{r.type}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impact (Days)</p>
                                                <p className="font-black text-slate-800 text-xs">+{r.impactDays}d</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impact (Cost)</p>
                                                <p className="font-black text-slate-800 text-xs">₹{r.impactCost.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Probability</p>
                                                <p className="font-black text-slate-800 text-xs">{(r.probability * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Module 3: Phase-wise Project Calculator */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Construction className="w-40 h-40 text-slate-900" />
                </div>
                <div className="relative z-10">
                    <div className="mb-10">
                        <h3 className="text-3xl font-black text-slate-800">Phase-wise Forecast</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Interconnected Execution Roadmap</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { phase: 'Sub-Structure', weight: 0.15, icon: 'Foundation' },
                            { phase: 'Super-Structure', weight: 0.45, icon: 'Skeleton' },
                            { phase: 'MEP & Systems', weight: 0.20, icon: 'Vitals' },
                            { phase: 'Finishing', weight: 0.20, icon: 'Atmosphere' }
                        ].map((p, i) => {
                            const phaseCost = metrics.totalCost * p.weight;
                            const phaseDays = metrics.totalDays * p.weight;
                            return (
                                <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-lg hover:-translate-y-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{p.phase}</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-black text-slate-800 text-lg">₹{Math.round(phaseCost).toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Phase Cost</p>
                                        </div>
                                        <div className="pt-3 border-t border-slate-200">
                                            <p className="font-black text-slate-800 text-lg">{Math.round(phaseDays)} Days</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Phase Duration</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Analytics Engine Synced</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setRisks([]);
                            setActiveScenarios([]);
                            localStorage.removeItem('buildwise_intelligence');
                        }}
                        className="px-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset Data
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Intelligence
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectIntelligence;
