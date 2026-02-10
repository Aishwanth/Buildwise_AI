
import * as React from 'react';
import { AIPlanningResult } from '../types';
import { Clock, DollarSign, Package, ClipboardList, BarChart3, PieChart as PieChartIcon, Printer, Box } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import BlueprintCanvas from './BlueprintCanvas';

interface ResultDisplayProps {
  result: AIPlanningResult;
  onView3D: () => void;
  mode?: 'full' | 'phasing' | 'calculator';
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onView3D, mode = 'full' }) => {
  const laborCost = result.costBreakdown.find(c => c.category.toLowerCase().includes('labor'))?.amount || 0;
  const materialCost = result.costBreakdown.find(c => c.category.toLowerCase().includes('material'))?.amount || 0;
  const overhead = result.costBreakdown.find(c => c.category.toLowerCase().includes('overhead'))?.amount || (laborCost + materialCost) * 0.1;
  const totalCost = laborCost + materialCost + overhead;

  const costData = [
    { name: 'Labor', value: laborCost },
    { name: 'Materials', value: materialCost },
    { name: 'Overhead', value: overhead }
  ].filter(d => d.value > 0);

  const materialData = result.materialRequirements.map(m => ({
    name: m.item,
    quantity: parseFloat(m.quantity.replace(/[^0-9.]/g, '')) || 0,
    unit: m.unit
  })).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 pb-24 w-full">
      {/* Header Info */}
      <div
        style={{ animationDelay: '100ms' }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm gap-6 feature-transition opacity-0"
      >
        <div>
          <h2 className="text-3xl font-black text-slate-800">Intelligence Report</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Ref ID: BW-{Math.floor(Math.random() * 9000) + 1000}</p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:bg-indigo-700 transition-all"
        >
          <Printer className="w-5 h-5" />
          Export Analysis
        </button>
      </div>

      {/* Main Metrics - Hidden in Phasing Mode */}
      {mode !== 'phasing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            style={{ animationDelay: '200ms' }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm feature-transition opacity-0"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Timeline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Days</span>
                <span className="text-slate-900 font-black text-xl">{result.timeline.days}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Weeks</span>
                <span className="text-slate-900 font-black text-xl">{result.timeline.weeks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Months</span>
                <span className="text-slate-900 font-black text-xl">{result.timeline.months}</span>
              </div>
            </div>
          </div>

          <div
            style={{ animationDelay: '300ms' }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center feature-transition opacity-0"
          >
            <div className="flex items-center gap-4 mb-8 self-start ml-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Budget</h3>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-slate-900">₹{totalCost.toLocaleString()}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Est. Project Total</p>
              <div className="mt-6 pt-4 border-t border-slate-50 w-full">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Contingency</span>
                  <span className="text-emerald-600">₹{(totalCost * 0.05).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ animationDelay: '400ms' }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm feature-transition opacity-0"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Personnel</h3>
            </div>
            <div className="space-y-3">
              {result.workerRequirements.map((req, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{req.role}</span>
                  <span className="text-slate-800">{req.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Graphical Reports - Hidden in Phasing Mode */}
      {mode !== 'phasing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            style={{ animationDelay: '500ms' }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm feature-transition opacity-0"
          >
            <div className="flex items-center gap-4 mb-8">
              <PieChartIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-black text-slate-800">Cost Analysis</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{ animationDelay: '600ms' }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm feature-transition opacity-0"
          >
            <div className="flex items-center gap-4 mb-8">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-black text-slate-800">Material Intensity</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="quantity" fill="#4f46e5" radius={[5, 5, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Blueprint visualization - Hidden in Calculator Mode */}
      {result.blueprint && result.blueprint.rooms.length > 0 && mode !== 'calculator' && (
        <div
          style={{ animationDelay: '700ms' }}
          className="bg-[#0a1128] p-1 gap-1 rounded-[2rem] border-8 border-[#1e293b] shadow-2xl relative group overflow-hidden feature-transition opacity-0"
        >
          <div className="absolute top-12 right-12 z-20">
            <button
              onClick={onView3D}
              className="bg-blue-500/20 backdrop-blur-md border border-blue-400 text-blue-400 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-400 hover:text-white transition-all shadow-lg"
            >
              <Box className="w-3 h-3" />
              3D Probe
            </button>
          </div>
          <BlueprintCanvas rooms={result.blueprint.rooms} totalArea={result.blueprint.totalAreaSqYards} />
        </div>
      )}

      {/* Construction Schedule - Hidden in Calculator Mode */}
      {result.schedule && mode !== 'calculator' && (
        <div
          style={{ animationDelay: '800ms' }}
          className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden feature-transition opacity-0"
        >
          <div className="p-8 border-b border-slate-100 flex items-center gap-5 bg-slate-50">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Project Phasing</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-0.5">Step-by-Step Roadmap</p>
            </div>
          </div>
          <div className="p-10 space-y-0">
            {result.schedule.map((step, idx) => (
              <div key={idx} className="relative flex gap-10 pb-12 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl border-4 border-white bg-indigo-600 flex items-center justify-center shadow-xl z-10 text-white font-black text-sm">
                    {step.week}
                  </div>
                  {idx !== result.schedule!.length - 1 && (
                    <div className="w-1 flex-1 bg-indigo-50 mt-4 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-black text-slate-800">{step.phase}</h4>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">W-{step.week}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {step.activities.map((act, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {act}
                      </span>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center gap-4">
                    <p className="text-[10px] font-black uppercase text-slate-400">Resources:</p>
                    <div className="flex flex-wrap gap-2">
                      {step.resources.map((res, i) => (
                        <span key={i} className="text-[10px] font-black text-indigo-400 uppercase">
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
