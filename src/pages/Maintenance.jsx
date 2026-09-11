import React, { useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Cpu, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar
} from 'lucide-react';

export default function Maintenance({ machines, onOpenAdvisory }) {
  const [scheduledMachine, setScheduledMachine] = useState(null);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1">
            <Wrench className="w-4 h-4" />
            <span>PREDICTIVE PLANT MAINTENANCE</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Factory Floor Machine Health & Component Advisories
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time equipment degradation tracking driven by automated surface defect telemetry. Correlates optical defect recurring signatures with mechanical wear.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-slate-400">
            Active Stations: <strong className="text-white">4 Machines</strong>
          </div>
          <div className="bg-emerald-950 px-3 py-2 rounded-lg border border-emerald-800 text-emerald-300">
            Scheduled PM Cycle: <strong className="text-white">24 Hours</strong>
          </div>
        </div>
      </div>

      {/* Machine 01 to Machine 04 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {machines && machines.map((m) => {
          const isCritical = m.priority === 'CRITICAL' || m.status === 'DEGRADED';
          const isHigh = m.priority === 'HIGH' || m.status === 'WARNING';
          
          const statusBadge = isCritical 
            ? 'bg-red-950 text-red-300 border-red-700' 
            : isHigh 
            ? 'bg-amber-950 text-amber-300 border-amber-700' 
            : 'bg-emerald-950 text-emerald-300 border-emerald-700';

          const priorityBadge = m.priority === 'CRITICAL'
            ? 'bg-red-600 text-white'
            : m.priority === 'HIGH'
            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
            : m.priority === 'MEDIUM'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';

          return (
            <div
              key={m.machine_id}
              className={`bg-[#0f172a] border rounded-2xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between ${
                isCritical 
                  ? 'border-red-500/50 shadow-red-950/20' 
                  : isHigh 
                  ? 'border-amber-500/40 shadow-amber-950/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Machine ID & Status */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-base font-black text-white">{m.machine_id}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                        {m.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-300 mt-0.5">{m.name}</h3>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block">HEALTH INDEX</span>
                    <span className={`text-2xl font-black ${
                      m.health_score > 85 ? 'text-emerald-400' : m.health_score > 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {m.health_score}%
                    </span>
                  </div>
                </div>

                {/* Health Meter Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.health_score > 85 ? 'bg-emerald-500' : m.health_score > 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${m.health_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">DEFECT FREQUENCY</span>
                    <strong className="text-white text-sm">{m.defect_frequency}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ACTION PRIORITY</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${priorityBadge}`}>
                      {m.priority}
                    </span>
                  </div>
                </div>

                {/* Last Detected Issue */}
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 mb-3">
                  <span className="text-slate-500 block text-[10px] font-mono mb-1">LAST DETECTED ANOMALY</span>
                  <div className="text-xs text-slate-200 font-sans flex items-start space-x-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                    <span>{m.last_detected_issue}</span>
                  </div>
                </div>

                {/* Recommended Maintenance */}
                <div className="bg-cyan-950/20 p-3.5 rounded-lg border border-cyan-800/40 mb-4">
                  <span className="text-cyan-400 block text-[10px] font-mono font-bold mb-1 flex items-center space-x-1">
                    <Wrench className="w-3 h-3" />
                    <span>RECOMMENDED WORK DIRECTIVE</span>
                  </span>
                  <div className="text-xs text-slate-200 font-sans leading-relaxed">
                    {m.recommended_maintenance}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
                {scheduledMachine === m.machine_id ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Work Order Dispatched</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setScheduledMachine(m.machine_id);
                      setTimeout(() => setScheduledMachine(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Schedule Service</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenAdvisory({
                    type: m.machine_id === 'Machine 04' ? 'Scratch' : m.machine_id === 'Machine 01' ? 'Crack' : m.machine_id === 'Machine 02' ? 'Discoloration' : 'Dent',
                    confidence: 0.94,
                    pattern: m.last_detected_issue,
                    severity: m.priority
                  }, {
                    probable_component: m.machine_id === 'Machine 04' ? 'Conveyor Belt Roller #2' : m.machine_id === 'Machine 01' ? 'Primary Stamping Die Press #1' : m.machine_id === 'Machine 02' ? 'Induction Annealing Coil #2' : 'Pneumatic Pick-and-Place Gripper #4',
                    reasoning: m.last_detected_issue
                  }, {
                    advisory_id: `ADV-${m.machine_id.replace(' ', '')}`,
                    machine_id: m.machine_id,
                    probable_component: m.machine_id === 'Machine 04' ? 'Conveyor Belt Roller #2' : m.machine_id === 'Machine 01' ? 'Primary Stamping Die Press #1' : m.machine_id === 'Machine 02' ? 'Induction Annealing Coil #2' : 'Pneumatic Pick-and-Place Gripper #4',
                    root_cause_reasoning: m.last_detected_issue,
                    recommended_action: m.recommended_maintenance,
                    priority: m.priority,
                    estimated_urgency: m.priority === 'CRITICAL' ? 'Immediate' : 'Within 4 Hours',
                    created_at: new Date().toISOString()
                  })}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer font-bold"
                >
                  <span>Full Advisory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
