import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Shield, HardHat, Hand, Footprints, X } from 'lucide-react';
import { Worker } from '../types';

interface SafetyCheckProps {
  worker: Worker;
  onClose: () => void;
  onSafetyUpdate: (workerId: string, safetyChecks: SafetyChecks) => void;
}

export interface SafetyChecks {
  helmetWorn: boolean;
  glovesWorn: boolean;
  shoesWorn: boolean;
  timestamp: string;
}

const SafetyCheck: React.FC<SafetyCheckProps> = ({ worker, onClose, onSafetyUpdate }) => {
  const [safetyData, setSafetyData] = useState<SafetyChecks>({
    helmetWorn: false,
    glovesWorn: false,
    shoesWorn: false,
    timestamp: new Date().toISOString(),
  });

  const allChecksPassed = safetyData.helmetWorn && safetyData.glovesWorn && safetyData.shoesWorn;

  const handleConfirm = () => {
    onSafetyUpdate(worker.id, safetyData);
    onClose();
  };

  const toggleCheck = (key: keyof Omit<SafetyChecks, 'timestamp'>) => {
    setSafetyData(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Safety Confirmation</h3>
              <p className="text-sm text-slate-500">{worker.name} - {worker.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Safety Checks */}
        <div className="space-y-5 mb-8 bg-amber-50 p-6 rounded-2xl border border-amber-200">
          {/* Helmet Check */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${safetyData.helmetWorn ? 'bg-green-100' : 'bg-slate-100'}`}>
                <HardHat className={`w-5 h-5 ${safetyData.helmetWorn ? 'text-green-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Safety Helmet</p>
                <p className="text-xs text-slate-500">Hard hat or protective headgear</p>
              </div>
            </div>
            <button
              onClick={() => toggleCheck('helmetWorn')}
              className={`p-3 rounded-xl transition-all ${
                safetyData.helmetWorn
                  ? 'bg-green-100 text-green-600'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </div>

          {/* Gloves Check */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${safetyData.glovesWorn ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Hand className={`w-5 h-5 ${safetyData.glovesWorn ? 'text-green-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Work Gloves</p>
                <p className="text-xs text-slate-500">Protective gloves or mitts</p>
              </div>
            </div>
            <button
              onClick={() => toggleCheck('glovesWorn')}
              className={`p-3 rounded-xl transition-all ${
                safetyData.glovesWorn
                  ? 'bg-green-100 text-green-600'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </div>

          {/* Shoes Check */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${safetyData.shoesWorn ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Footprints className={`w-5 h-5 ${safetyData.shoesWorn ? 'text-green-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Safety Shoes</p>
                <p className="text-xs text-slate-500">Steel-toed or protective footwear</p>
              </div>
            </div>
            <button
              onClick={() => toggleCheck('shoesWorn')}
              className={`p-3 rounded-xl transition-all ${
                safetyData.shoesWorn
                  ? 'bg-green-100 text-green-600'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {!allChecksPassed && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">⚠️ Safety Requirements Not Met</p>
              <p className="text-xs text-red-700 mt-1">
                All safety equipment must be confirmed before work begins
              </p>
            </div>
          </div>
        )}

        {allChecksPassed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900 text-sm">✓ All Safety Checks Passed</p>
              <p className="text-xs text-green-700 mt-1">Worker is cleared to begin work</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allChecksPassed}
            className={`flex-1 px-6 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
              allChecksPassed
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyCheck;
