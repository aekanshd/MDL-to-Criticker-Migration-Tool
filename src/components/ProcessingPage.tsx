import React from "react";
import { Loader2 } from "lucide-react";

export const ProcessingPage: React.FC<{ progress: number; total: number }> = ({ progress, total }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 glass-panel rounded-3xl p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
      
      <Loader2 className="w-16 h-16 animate-spin text-indigo-400 relative z-10" />
      
      <div className="text-center space-y-3 relative z-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Matching TMDB & IMDb Data</h2>
        <p className="text-indigo-300 italic">Synchronizing your drama list with global databases...</p>
      </div>

      <div className="w-full max-w-lg bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 relative z-10 p-0.5">
        <div 
          className="bg-indigo-500 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
          style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
        />
      </div>
      
      <div className="flex flex-col items-center gap-1 relative z-10">
        <p className="text-sm font-mono text-indigo-200 uppercase tracking-widest">{progress} / {total} items</p>
        <p className="text-[10px] text-slate-500 font-mono">ESTIMATED TIME: {Math.max(1, Math.ceil((total - progress) * 0.5))}s REMAINING</p>
      </div>
    </div>
  );
};
