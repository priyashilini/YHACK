import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import StatCard from '../components/StatCard';

const DEFECT_COLORS = {
  Scratch: '#06b6d4',      // Cyan
  Crack: '#ef4444',        // Red
  Dent: '#f59e0b',         // Amber
  Discoloration: '#a855f7' // Purple
};

export default function Dashboard({
  analytics,
  machines,
  recentInspections,
  onNavigate,
  onSelectInspection
}) {
  const defectData = Object.entries(analytics?.defect_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: DEFECT_COLORS[name] || '#94a3b8'
  }));

  const trendData = analytics?.recent_trend || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Quick Summary & Live CTA */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#111e38] to-[#0f172a] border border-cyan-500/30 rounded-2xl p-5 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1">
              <Cpu className="w-4 h-4" />
              <span>EDGE AI TELEMETRY // FACTORY BAY 01</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Industrial Surface Inspection Overview
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time CLAHE illumination normalization and multi-class surface defect inference running on simulated edge hardware.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('live')}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
            >
              <span>Launch Live Conveyor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('analysis')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition"
            >
              Inspect Part Image
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Inspections"
          value={analytics?.total_inspections ?? 0}
          unit="Parts"
          subtext="Active line counter"
          icon={Layers}
          color="blue"
          trend="+12% today"
        />
        <StatCard
          title="Pass Rate"
          value={`${analytics?.pass_rate ?? 0}%`}
          unit=""
          subtext={`${analytics?.pass_count ?? 0} parts nominal`}
          icon={CheckCircle2}
          color="green"
          trend="Nominal"
        />
        <StatCard
          title="Defects Detected"
          value={analytics?.defects_detected ?? 0}
          unit="Anomalies"
          subtext={`${analytics?.fail_count ?? 0} Fail • ${analytics?.review_count ?? 0} Review`}
          icon={XCircle}
          color="red"
          trend="Actionable"
        />
        <StatCard
          title="Avg Detection Time"
          value={analytics?.avg_detection_time_ms ?? 32}
          unit="ms"
          subtext="CLAHE + YOLO Inference"
          icon={Clock}
          color="cyan"
          trend="<50ms Target"
        />
        <StatCard
          title="Active Machines"
          value={`${analytics?.active_machines ?? 3} / 4`}
          unit="Operational"
          subtext="1 Under Degraded State"
          icon={Activity}
          color="amber"
          trend="Monitored"
        />
      </div>

      {/* Charts Row: Defect Distribution & Inspection Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Defect Distribution (Donut Chart) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Defect Class Distribution
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                4 Classes
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown across Scratch, Crack, Dent, and Discoloration.
            </p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {defectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300 font-mono">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Pill List */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-cyan-400">Scratch:</span>
              <strong className="text-white">{analytics?.defect_distribution?.Scratch || 0}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-red-400">Crack:</span>
              <strong className="text-white">{analytics?.defect_distribution?.Crack || 0}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-400">Dent:</span>
              <strong className="text-white">{analytics?.defect_distribution?.Dent || 0}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-purple-400">Discoloration:</span>
              <strong className="text-white">{analytics?.defect_distribution?.Discoloration || 0}</strong>
            </div>
          </div>
        </div>

        {/* Real-time Inspection Trend (Area Chart) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Inspection Confidence & Latency Trend
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Recent Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time confidence scoring (%) and edge inference latency (ms) per part.
            </p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#475569" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#confidenceGrad)"
                    name="Confidence (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#latencyGrad)"
                    name="Latency (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
            <span>Target Latency: <strong className="text-cyan-400">&lt;50ms</strong></span>
            <span>Edge Model: <strong className="text-white">EdgeDefect-YOLO</strong></span>
          </div>
        </div>

      </div>

      {/* Machine Status Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Machine Health Status Overview</span>
          </h3>
          <button
            onClick={() => onNavigate('maintenance')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
          >
            <span>View All Maintenance Cards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {machines && machines.map((m) => {
            const isDegraded = m.status === 'DEGRADED';
            const isWarning = m.status === 'WARNING';
            const badgeColor = isDegraded 
              ? 'bg-red-950 text-red-300 border-red-800' 
              : isWarning 
              ? 'bg-amber-950 text-amber-300 border-amber-800' 
              : 'bg-emerald-950 text-emerald-300 border-emerald-800';

            return (
              <div
                key={m.machine_id}
                onClick={() => onNavigate('maintenance')}
                className="bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">{m.machine_id}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${badgeColor}`}>
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-medium truncate mb-3">
                  {m.name}
                </div>

                {/* Health progress bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Health Score</span>
                    <span className="text-cyan-400 font-bold">{m.health_score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.health_score > 85 ? 'bg-emerald-500' : m.health_score > 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${m.health_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 truncate">
                  <span className="text-slate-500 block text-[9px] font-mono">LATEST ISSUE</span>
                  {m.last_detected_issue}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Inspections Telemetry Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Recent Edge Inspections Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Live automated pass/fail stream from factory lines
            </p>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded border border-amber-800 flex items-center space-x-1"
          >
            <span>Open Manual Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">PART ID</th>
                <th className="pb-3 font-semibold">TIMESTAMP</th>
                <th className="pb-3 font-semibold">MACHINE</th>
                <th className="pb-3 font-semibold">DEFECT CLASS</th>
                <th className="pb-3 font-semibold">CONFIDENCE</th>
                <th className="pb-3 font-semibold">RESULT</th>
                <th className="pb-3 font-semibold">LATENCY</th>
                <th className="pb-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentInspections && recentInspections.slice(0, 7).map((rec) => {
                const isPass = rec.result === 'PASS';
                const isFail = rec.result === 'FAIL';
                const isReview = rec.result === 'REVIEW';

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-bold text-white">{rec.part_id}</td>
                    <td className="py-3 text-slate-400">
                      {rec.timestamp ? rec.timestamp.replace(' UTC', '') : 'Just now'}
                    </td>
                    <td className="py-3 text-slate-300">{rec.machine_id}</td>
                    <td className="py-3">
                      {rec.defect_type ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.defect_type === 'Scratch' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                          rec.defect_type === 'Crack' ? 'bg-red-950 text-red-400 border border-red-800' :
                          rec.defect_type === 'Dent' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}>
                          {rec.defect_type}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans">Nominal</span>
                      )}
                    </td>
                    <td className="py-3 text-cyan-300 font-bold">
                      {(rec.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3">
                      {isPass && (
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          PASS
                        </span>
                      )}
                      {isFail && (
                        <span className="px-2 py-0.5 rounded font-bold bg-red-950 text-red-300 border border-red-800">
                          FAIL
                        </span>
                      )}
                      {isReview && (
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          REVIEW
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400">{rec.processing_time_ms}ms</td>
                    <td className="py-3 text-right">
                      {rec.root_cause || rec.result !== 'PASS' ? (
                        <button
                          onClick={() => onSelectInspection(rec)}
                          className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                        >
                          View RCA
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
