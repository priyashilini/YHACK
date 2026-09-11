import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  ScanEye, 
  CheckSquare, 
  Wrench, 
  BarChart3, 
  Sliders, 
  Cpu, 
  Activity, 
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, reviewCount = 0, isOnline = true }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Inspection', icon: Video, badge: 'LIVE' },
    { id: 'analysis', label: 'Image Analysis', icon: ScanEye },
    { id: 'review', label: 'Review Queue', icon: CheckSquare, count: reviewCount },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Bar: System Status, Engine Status, Time */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0a0f1d] flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-mono uppercase font-medium text-slate-300">
              {isOnline ? 'Edge System Online' : 'Offline / Reconnecting'}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="hidden sm:flex items-center space-x-1 text-slate-400 font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>OpenCV CLAHE + EdgeDefect AI</span>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="hidden md:flex items-center space-x-1 text-cyan-400/90 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/50">DEMO MODE ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-slate-400">
          <div className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Latency: <strong className="text-emerald-300">32ms</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00'}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation & Title */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xl tracking-tighter shadow-lg shadow-cyan-500/20">
            P
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-wider text-white uppercase font-mono">
                PRIVISA
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-700/60">
                EdgeDefect AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Industrial Surface Inspection
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[9px] font-bold rounded animate-pulse border border-red-500/40">
                    {item.badge}
                  </span>
                )}
                {item.count > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
