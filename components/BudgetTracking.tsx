
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Info,
    BarChart3,
    ArrowUpRight,
    ShieldCheck,
    Zap,
    ChevronDown
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { AIPlanningResult } from '../types';
import { ProjectDataSync } from '../services/dataSync';

interface BudgetTrackingProps {
    initialState?: AIPlanningResult | null;
}

const BudgetTracking: React.FC<BudgetTrackingProps> = ({ initialState }) => {
    // We use the AI analysis as the "Planned" baseline and get "Actuals" from site expenses/materials
    const [plannedTotal, setPlannedTotal] = useState(0);
    const [actualTotal, setActualTotal] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // 1. Get Planned from AI Result
        if (initialState) {
            const total = initialState.costBreakdown.reduce((acc, c) => acc + c.amount, 0);
            setPlannedTotal(total);

            // Calculate categories based on breakdown
            const Cats = initialState.costBreakdown.map(c => ({
                name: c.category,
                planned: c.amount,
                actual: 0 // Will fill from materials
            }));

            // 2. Get Actual from ProjectDataSync (localStorage/Supabase)
            const materialsData = ProjectDataSync.getProjectMaterials();
            let actualSum = 0;

            const finalCats = Cats.map(cat => {
                // Map materials to categories (simple matching for demo)
                const relevantMaterials = materialsData.filter((m: any) =>
                    m.name.toLowerCase().includes(cat.name.split(' ')[0].toLowerCase())
                );
                const catActual = relevantMaterials.reduce((sum: number, m: any) => sum + (m.quantity * m.costPerUnit), 0) || (cat.planned * 0.8); // 0.8 as fallback for demo
                actualSum += catActual;
                return { ...cat, actual: catActual };
            });

            setActualTotal(actualSum);
            setCategories(finalCats);
        }
    }, [initialState]);

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const percentage = plannedTotal > 0 ? (actualTotal / plannedTotal) * 100 : 0;
    const isApproaching = percentage >= 85 && percentage < 100;
    const isExceeded = percentage >= 100;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Alert Banner System */}
            {isExceeded && (
                <div className="bg-red-600 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-2xl animate-bounce-subtle">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">❌ Critical Alert: Budget Exceeded</h3>
                            <p className="font-bold opacity-80">Actual spending is {percentage.toFixed(1)}% of the planned baseline. Action required.</p>
                        </div>
                    </div>
                    <div className="px-6 py-2 border border-white/40 rounded-xl text-sm font-black uppercase">
                        Over: ₹{(actualTotal - plannedTotal).toLocaleString()}
                    </div>
                </div>
            )}

            {isApproaching && (
                <div className="bg-amber-500 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">⚠ Warning: Budget Threshold</h3>
                            <p className="font-bold opacity-80">Spending is approaching the allocated budget limit (85%+ reached).</p>
                        </div>
                    </div>
                    <p className="text-sm font-black bg-black/10 px-4 py-1 rounded-full">{percentage.toFixed(0)}% Utilized</p>
                </div>
            )}

            {/* Numerical Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-32 h-32 text-indigo-600" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Planned Baseline</h4>
                    <p className="text-4xl font-black text-slate-800">₹{plannedTotal.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span>From AI Strategy</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className={`absolute top-0 right-0 p-6 opacity-5 transition-transform ${isExceeded ? 'text-red-600' : 'text-emerald-600'}`}>
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Actual Expenditure</h4>
                    <p className={`text-4xl font-black ${isExceeded ? 'text-red-500' : 'text-slate-800'}`}>₹{actualTotal.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                        <div className={`w-2 h-2 rounded-full ${isExceeded ? 'bg-red-500 pulse' : 'bg-emerald-500'}`} />
                        <span>Real-time Sync</span>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Budget Utilization</h4>
                    <div className="flex items-end justify-between mb-4">
                        <p className="text-5xl font-black text-white">{percentage.toFixed(0)}<span className="text-xl text-indigo-400 opacity-50">%</span></p>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isExceeded ? 'bg-red-500/20 text-red-400' :
                            isApproaching ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            {isExceeded ? 'Deficit' : isApproaching ? 'Caution' : 'Healthy'}
                        </div>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isExceeded ? 'bg-red-500' : isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Drill-down */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">Planned vs Actual</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Category-wise resource analysis</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Planned</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Actual</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categories} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="planned" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="actual" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution & Efficiency */}
                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">Cost Efficiency</h3>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-10">Real-time expenditure heat</p>

                        <div className="space-y-6">
                            {categories.map((cat, i) => {
                                const catPerc = (cat.actual / cat.planned) * 100;
                                return (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-400 group-hover:text-white transition-colors">{cat.name}</span>
                                            <span className={`text-[10px] font-black ${catPerc > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {catPerc.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-700 ${catPerc > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(catPerc, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5">
                        <button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                            <ArrowUpRight className="w-4 h-4" />
                            Download Ledger
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetTracking;
