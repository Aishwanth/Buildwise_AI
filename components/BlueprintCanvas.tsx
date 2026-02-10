
import React from 'react';
import { BlueprintRoom } from '../types';

interface BlueprintCanvasProps {
  rooms: BlueprintRoom[];
  totalArea?: number;
}

const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({ rooms, totalArea }) => {
  // Use a scale that fits the premium container
  const scale = 12;

  return (
    <div className="bg-[#0a1128] w-full p-8 md:p-12 font-sans relative overflow-hidden flex flex-col items-center">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Outer Border Frame */}
      <div className="relative w-full max-w-5xl z-10 border-[3px] border-blue-900/50 p-6 md:p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-950/20">

        {/* Header Title Section */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#1e293b] px-20 py-3 border border-blue-900/50 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h3 className="text-blue-300 font-bold tracking-[0.3em] text-sm uppercase">Ground Floor</h3>
          </div>
        </div>

        {/* Blueprint Layout Area */}
        <div className="relative min-h-[450px] w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, idx) => (
            <div
              key={idx}
              className="bg-blue-900/10 border border-blue-500/40 p-5 rounded-sm relative group hover:bg-blue-500/5 transition-all"
            >
              {/* Box Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-400 opacity-50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-400 opacity-50" />

              <div className="mb-4">
                <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest leading-tight mb-1">
                  {room.name}
                </h4>
                <p className="text-blue-200/40 text-[9px] font-bold uppercase tracking-tighter">
                  {room.name.split(' ')[0]} {idx + 1}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-blue-900/30">
                <p className="text-blue-300/60 font-mono text-[10px] tracking-widest">
                  {room.width.toFixed(1)}' x {room.height.toFixed(1)}'
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info Area */}
        <div className="mt-10 pt-6 border-t border-blue-900/30 flex justify-center">
          <div className="bg-blue-900/20 px-8 py-3 border border-blue-900/50 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">
                Total Area: <span className="text-white ml-2">{totalArea || 1000} Sq. Yards</span>
              </span>
            </div>
            <div className="w-1 h-3 bg-blue-900/50" />
            <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">
              Scale: <span className="text-white ml-2">1/100</span>
            </span>
          </div>
        </div>

      </div>

      {/* Background Decorative Element */}
      <div className="absolute bottom-[-10%] left-[-5%] text-slate-900 font-black text-[15rem] leading-none opacity-10 pointer-events-none select-none">
        01
      </div>
    </div>
  );
};

export default BlueprintCanvas;
