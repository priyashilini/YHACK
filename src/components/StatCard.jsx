import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  unit = '', 
  subtext = '', 
  icon: Icon, 
  color = 'cyan', 
  trend = null 
}) {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      bg: 'bg-cyan-500/5',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-950/20',
      badge: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/40'
    },
    green: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-950/20',
      badge: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      bg: 'bg-red-500/5',
      text: 'text-red-400',
      glow: 'shadow-red-950/20',
      badge: 'bg-red-950/50 text-red-400 border-red-800/40'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'bg-amber-500/5',
      text: 'text-amber-400',
      glow: 'shadow-amber-950/20',
      badge: 'bg-amber-950/50 text-amber-400 border-amber-800/40'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      glow: 'shadow-blue-950/20',
      badge: 'bg-blue-950/50 text-blue-400 border-blue-800/40'
    }
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className={`relative bg-[#0f172a] border ${c.border} rounded-xl p-5 shadow-lg ${c.glow} transition-all duration-200 overflow-hidden`}>
      {/* Decorative corner reticle */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-20">
        <div className="absolute top-2 right-2 w-3 h-0.5 bg-slate-400"></div>
        <div className="absolute top-2 right-2 w-0.5 h-3 bg-slate-400"></div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500 truncate">{subtext}</span>
        {trend && (
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${c.badge}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
