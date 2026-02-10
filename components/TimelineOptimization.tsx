
import * as React from 'react';
import {
    Clock,
    Calendar,
    Zap,
    Users,
    ArrowRightLeft,
    Search,
    ShieldAlert,
    Cpu,
    MessageSquare,
    Recycle,
    BarChart3,
    Loader2,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { calculateTimelineOptimization } from '../services/geminiService';
import { TimelineOptimizationResult } from '../types';

const TimelineOptimization: React.FC = () => {
    const [area, setArea] = React.useState('150');
    const [projectType, setProjectType] = React.useState('Residential');
    const [floors, setFloors] = React.useState('G+1');
    const [targetDays, setTargetDays] = React.useState('180');
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<TimelineOptimizationResult | null>(null);

    // Persistence Hook
    React.useEffect(() => {
        const savedResult = localStorage.getItem('timeline_opt_result');
        const savedInputs = localStorage.getItem('timeline_opt_inputs');
        if (savedResult) setResult(JSON.parse(savedResult));
        if (savedInputs) {
            const inputs = JSON.parse(savedInputs);
            setArea(inputs.area);
            setProjectType(inputs.projectType);
            setFloors(inputs.floors);
            setTargetDays(inputs.targetDays);
        }
    }, []);

    React.useEffect(() => {
        if (result) localStorage.setItem('timeline_opt_result', JSON.stringify(result));
        localStorage.setItem('timeline_opt_inputs', JSON.stringify({ area, projectType, floors, targetDays }));
    }, [result, area, projectType, floors, targetDays]);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const data = await calculateTimelineOptimization({
                area: parseInt(area),
                projectType,
                floors,
                targetDays: parseInt(targetDays)
            });
            setResult(data);
        } catch (error) {
            alert("Optimization failed. Check your API key or parameters.");
        } finally {
            setLoading(false);
        }
    };

    const optimizationCards = result ? [
        {
            title: "Project Scheduling & Planning",
            icon: Calendar,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            metrics: [
                { label: "Gantt Tasks", value: result.scheduling.ganttTasks },
                { label: "Total Milestones", value: result.scheduling.totalMilestones },
                { label: "Avg Dependencies", value: result.scheduling.avgDependencyCount }
            ]
        },
        {
            title: "Critical Path Method (CPM)",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            metrics: [
                { label: "Critical Activities", value: result.cpm.criticalActivities },
                { label: "Final Duration", value: `${result.cpm.durationDays} Days` },
                { label: "Risk Factor", value: `${(result.cpm.riskFactor * 100).toFixed(0)}%` }
            ]
        },
        {
            title: "Resource Optimization",
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            metrics: [
                { label: "Labor Utilization", value: `${result.resourceOptimization.laborUtilization}%` },
                { label: "Machinery Efficiency", value: `${result.resourceOptimization.machineryEfficiency}%` },
                { label: "Waste Reduction", value: `${result.resourceOptimization.materialWastageReduction}%` }
            ]
        },
        {
            title: "Parallel Execution",
            icon: ArrowRightLeft,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            metrics: [
                { label: "Overlap Percentage", value: `${result.parallelExecution.overlapPercentage}%` },
                { label: "Days Saved", value: result.parallelExecution.timeSavedDays },
                { label: "Coordination Score", value: `${result.parallelExecution.coordinationIntensity}/10` }
            ]
        },
        {
            title: "Real-Time Progress",
            icon: Search,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            metrics: [
                { label: "Updates / Week", value: result.progressMonitoring.updateFrequencyPerWeek },
                { label: "Projected Variance", value: `${result.progressMonitoring.projectedVariance}%` },
                { label: "Warning Status", value: result.progressMonitoring.earlyWarningStatus }
            ]
        },
        {
            title: "Delay & Risk Management",
            icon: ShieldAlert,
            color: "text-red-500",
            bg: "bg-red-500/10",
            metrics: [
                { label: "Identified Risks", value: result.riskManagement.riskCount },
                { label: "Buffer Days", value: result.riskManagement.bufferDays },
                { label: "Contingency Fund", value: `₹${result.riskManagement.contingencyAmount.toLocaleString()}` }
            ]
        },
        {
            title: "Technology Integration",
            icon: Cpu,
            color: "text-teal-500",
            bg: "bg-teal-500/10",
            metrics: [
                { label: "Efficiency Boost", value: `${result.techIntegration.efficiencyBoost}%` },
                { label: "Data Accuracy", value: `${result.techIntegration.dataAccuracy}%` },
                { label: "Mobile Uptime", value: `${result.techIntegration.mobileUptime}%` }
            ]
        },
        {
            title: "Improved Communication",
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-600/10",
            metrics: [
                { label: "Approval Speed", value: `+${result.communication.approvalSpeedBoost}%` },
                { label: "Meeting Reduction", value: `${result.communication.meetingCountReduced}%` },
                { label: "Clarity Score", value: `${result.communication.clarityScore}/10` }
            ]
        },
        {
            title: "Lean Construction",
            icon: Recycle,
            color: "text-green-600",
            bg: "bg-green-600/10",
            metrics: [
                { label: "Value-Add %", value: `${result.leanPractices.valueAddActivitiesPercent}%` },
                { label: "Rework Reduced", value: `${result.leanPractices.reworkReducedPercent}%` },
                { label: "Reliability Index", value: result.leanPractices.reliabilityIndex }
            ]
        },
        {
            title: "Performance Analysis",
            icon: BarChart3,
            color: "text-gray-600",
            bg: "bg-gray-600/10",
            metrics: [
                { label: "Schedule Perf Index", value: result.performanceAnalysis.spi },
                { label: "Actual Variance", value: `${result.performanceAnalysis.plannedVsActualVariance}%` },
                { label: "Improvement Pot.", value: `${result.performanceAnalysis.improvementPotential}%` }
            ]
        }
    ] : [];

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Header section with Inputs */}
            <div className="bg-white/70 backdrop-blur-xl border border-white p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Timeline Optimization Calculator</h2>
                            </div>
                            <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">
                                Enter your project parameters to calculate high-precision optimization metrics across 10 strategic pillars.
                            </p>
                        </div>
                        <button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                            {loading ? "Calculating..." : "Run Optimization"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Total Area (Sq. Yards)</label>
                            <input
                                type="number"
                                value={area}
                                onChange={e => setArea(e.target.value)}
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Project Type</label>
                            <select
                                value={projectType}
                                onChange={e => setProjectType(e.target.value)}
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none"
                            >
                                <option>Residential</option>
                                <option>Commercial</option>
                                <option>Industrial</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Floors</label>
                            <input
                                type="text"
                                value={floors}
                                onChange={e => setFloors(e.target.value)}
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Target Days</label>
                            <input
                                type="number"
                                value={targetDays}
                                onChange={e => setTargetDays(e.target.value)}
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            {result ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {optimizationCards.map((point, idx) => (
                        <div
                            key={idx}
                            className="bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-2 transition-all duration-300 group"
                        >
                            <div className={`w-14 h-14 ${point.bg} ${point.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                <point.icon className="w-7 h-7" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                <span className="text-slate-300 text-lg">0{idx + 1}.</span>
                                {point.title}
                            </h3>

                            <div className="space-y-6">
                                {point.metrics.map((metric, mIdx) => (
                                    <div key={mIdx} className="flex justify-between items-end border-b border-slate-50 pb-3">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{metric.label}</span>
                                        <span className="text-slate-900 font-black text-lg">{metric.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : !loading && (
                <div className="bg-white/50 border-4 border-dashed border-slate-200 p-20 rounded-[3.5rem] flex flex-col items-center text-center">
                    <div className="p-6 bg-slate-100 rounded-3xl mb-8">
                        <AlertCircle className="w-12 h-12 text-slate-300" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-400 mb-2">Simulated Data Required</h4>
                    <p className="text-slate-400 max-w-sm font-medium">Configure your project specs above and run the AI optimization engine to see numerical outputs.</p>
                </div>
            )}

            {/* Bottom Call to Action */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('/grid.svg')] bg-center opacity-10" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div>
                        <h4 className="text-3xl font-black mb-4">Drive Faster Completion.</h4>
                        <p className="text-indigo-200 font-medium">These calculations are based on high-fidelity construction models and standard ${projectType} benchmarks.</p>
                    </div>
                    <button className="bg-white text-indigo-600 px-10 py-5 rounded-3xl font-black shadow-xl hover:scale-105 transition-all text-sm uppercase tracking-widest shrink-0">
                        Export Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimelineOptimization;
