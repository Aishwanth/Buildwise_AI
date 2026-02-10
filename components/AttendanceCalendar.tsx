
import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Worker } from '../types';

interface AttendanceCalendarProps {
  worker: Worker;
  onClose: () => void;
  onToggleDate: (dayIndex: number) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ worker, onClose, onToggleDate }) => {
  const [displayDate, setDisplayDate] = React.useState(new Date());
  
  const monthName = displayDate.toLocaleString('default', { month: 'long' });
  const year = displayDate.getFullYear();
  const monthIndex = displayDate.getMonth();
  
  // Calculate days in displayed month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
  
  // Calculate day index offset for the selected month
  const startOfYearToDisplayMonth = new Date(year, monthIndex, 1).getTime() - new Date(year, 0, 1).getTime();
  const dayOffset = Math.floor(startOfYearToDisplayMonth / (1000 * 60 * 60 * 24));
  
  const daysPresent = worker.attendance.filter((p, i) => i >= dayOffset && i < dayOffset + daysInMonth && p).length;
  const totalEarnings = daysPresent * worker.dailyWage;
  
  const handlePrevMonth = () => {
    setDisplayDate(new Date(year, monthIndex - 1, 1));
  };
  
  const handleNextMonth = () => {
    setDisplayDate(new Date(year, monthIndex + 1, 1));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black">{worker.name}</h3>
              <p className="text-indigo-200 font-bold text-xs uppercase tracking-widest">{worker.role} Attendance</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase text-indigo-100 mb-1">Days Present</p>
              <p className="text-2xl font-black">{daysPresent} / {daysInMonth}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase text-indigo-100 mb-1">Monthly Wage</p>
              <p className="text-2xl font-black">₹{totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-slate-800">{monthName} {year}</h4>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const absIndex = dayOffset + i;
              const isPresent = worker.attendance[absIndex];
              return (
                <button
                  key={dayNum}
                  onClick={() => onToggleDate(absIndex)}
                  className={`aspect-square rounded-xl text-sm font-bold transition-all flex items-center justify-center border-2 ${
                    isPresent 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-300 scale-105' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
