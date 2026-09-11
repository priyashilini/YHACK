import React from 'react';
import { 
  BarChart3, 
  Target, 
  Zap, 
  Clock, 
  TrendingDown, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Info,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';

const DEFECT_COLORS = {
  Scratch: '#06b6d4',
  Crack: '#ef4444',
  Dent: '#f59e0b',
  Discoloration: '#a855f7'
};

export default function Analytics({ analytics }) {
  const defectPercentages = analytics?.defect_percentages || {
    Scratch: 35.7,
    Crack: 28.6,
    Dent: 21.4,
    Discoloration: 14.3
  };

  const percentageData = Object.entries(defectPercentages).map(([name, pct]) => ({
    name,
    percentage: pct,
    count: analytics?.defect_distribution?.[name] || 0,
    fill: DEFECT_COLORS[name] || '#94a3b8'
  }));

  const passVsFailData = [
    { name: 'Nominal Pass', value: analytics?.pass_count || 14, color: '#10b981' },
    { name: 'Confirmed Fail', value: analytics?.fail_count || 9, color: '#ef4444' },
    { name: 'Review Queue', value: analytics?.review_count || 5, color: '#f59e0b' }
  ];

  // Defects by machine formatted for stacked bar
  const machineData = Object.entries(analytics?.defects_by_machine || {}).map(([mach, defs]) => ({
    machine: mach,
    Scratch: defs.Scratch || 0,
    Crack: defs.Crack || 0,
    Dent: defs.Dent || 0,
    Discoloration: defs.Discoloration || 0
  }));

  const trendData = analytics?.recent_trend || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>QUALITY ASSURANCE & DEFECT METRICS</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Factory Edge Inspection Analytics & Engineering Targets
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Aggregated defect Pareto distributions, pass/fail yields, equipment correlation, and edge latency benchmarks.
            </p>
          </div>

          <div className="px-3 py-2 bg-cyan-950/40 rounded-lg border border-cyan-800 font-mono text-xs text-cyan-300">
            Persistent Store: <strong>SQLite (28 Historical Audits)</strong>
          </div>
        </div>
      </div>

      {/* PROTOTYPE TARGETS CARDS (Prominently labeled as Prototype Target per requirements) */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Industrial Edge Benchmark Specifications</span>
          <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 text-[10px]">
            PROTOTYPE TARGET
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Target 1: Detection Accuracy */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#131f38] border border-cyan-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-bold text-cyan-300">
                Detection Accuracy Target
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
                Prototype Target
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl lg:text-4xl font-black font-mono text-white">
                95%+
              </span>
              <span className="text-xs font-mono text-slate-400">mAP@0.5 IoU</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Surface flaw classification accuracy across Scratch, Crack, Dent, and Discoloration with CLAHE illumination normalization.
            </p>
            <div className="mt-3 text-[10px] font-mono text-cyan-400/80 flex items-center space-x-1 border-t border-slate-800 pt-2">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Specification: EdgeDefect Benchmark Standard</span>
            </div>
          </div>

          {/* Target 2: Target Latency */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#131f38] border border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-bold text-emerald-300">
                Target Latency
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                Prototype Target
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl lg:text-4xl font-black font-mono text-white">
                &lt;50ms
              </span>
              <span className="text-xs font-mono text-slate-400">Total Frame Budget</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Real-time conveyor synchronization: ~4ms OpenCV CLAHE + ~28ms lightweight YOLOv8 edge inference running on localized hardware.
            </p>
            <div className="mt-3 text-[10px] font-mono text-emerald-400/80 flex items-center space-x-1 border-t border-slate-800 pt-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conveyor line rate: Up to 1,200 parts/min</span>
            </div>
          </div>

          {/* Target 3: Downtime Reduction */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#131f38] border border-blue-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-bold text-blue-300">
                Downtime Reduction Target
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono font-bold">
                Prototype Target
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl lg:text-4xl font-black font-mono text-white">
                80%
              </span>
              <span className="text-xs font-mono text-slate-400">Unplanned Outage Avoidance</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Instant root-cause equipment attribution flags seized bearings and stamping fatigue hours before catastrophic mechanical failure.
            </p>
            <div className="mt-3 text-[10px] font-mono text-blue-400/80 flex items-center space-x-1 border-t border-slate-800 pt-2">
              <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
              <span>Target Mean Time To Repair (MTTR) improvement</span>
            </div>
          </div>

        </div>
      </div>

      {/* Charts Row 1: Defect Percentages & Pass vs Fail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Defect Percentages Bar Chart */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Defect Type Percentages (Pareto Breakdown)
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              Total Defects: {analytics?.defects_detected || 14}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Percentage contribution of Scratch, Crack, Dent, and Discoloration.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={percentageData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }}
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  unit="%"
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
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} name="Defect Share (%)">
                  {percentageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs font-mono text-center">
            {percentageData.map((d) => (
              <div key={d.name} className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{d.name}</span>
                <strong className="text-white">{d.percentage}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Pass vs Fail Ratio Donut */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Pass vs Fail & Review Ratio
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                Yield: {analytics?.pass_rate || 50}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Distribution of Nominal Parts vs Confirmed Rejections vs Review Queue.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passVsFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {passVsFailData.map((entry, index) => (
                      <Cell key={`cell-passfail-${index}`} fill={entry.color} />
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
                    formatter={(value) => <span className="text-xs text-slate-300 font-mono">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Pass: <strong className="text-emerald-400">{analytics?.pass_count || 0}</strong></span>
            <span className="text-slate-400">Fail: <strong className="text-red-400">{analytics?.fail_count || 0}</strong></span>
            <span className="text-slate-400">Review: <strong className="text-amber-400">{analytics?.review_count || 0}</strong></span>
          </div>
        </div>

      </div>

      {/* Charts Row 2: Defects by Machine & Defects Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Defects by Machine (Stacked Bar) */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Defects by Machine Equipment
            </h3>
            <span className="text-xs font-mono text-cyan-400">Machine 01 – 04</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Mechanical station breakdown highlighting equipment failure modes.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <XAxis 
                  dataKey="machine" 
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
                <Legend 
                  verticalAlign="top" 
                  height={30}
                  formatter={(val) => <span className="text-[11px] text-slate-300 font-mono">{val}</span>}
                />
                <Bar dataKey="Scratch" stackId="a" fill="#06b6d4" />
                <Bar dataKey="Crack" stackId="a" fill="#ef4444" />
                <Bar dataKey="Dent" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Discoloration" stackId="a" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defects Over Time (Line Chart) */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Defect Detections Over Shift Timeline
            </h3>
            <span className="text-xs font-mono text-emerald-400">Historical Trend</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Defect occurrence progression across recent production batches.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
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
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Confidence (%)"
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Latency (ms)"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
