import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Wrench, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Printer, 
  X, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function RcaModal({
  isOpen,
  onClose,
  defectInfo,
  rootCause,
  maintenance
}) {
  const [advisoryGenerated, setAdvisoryGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !defectInfo) return null;

  const priorityColor = {
    CRITICAL: 'bg-red-950 text-red-400 border-red-800',
    HIGH: 'bg-red-900/60 text-red-300 border-red-700',
    MEDIUM: 'bg-amber-950 text-amber-400 border-amber-800',
    LOW: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  }[maintenance?.priority || 'HIGH'] || 'bg-slate-800 text-slate-300 border-slate-700';

  const handleCopy = () => {
    const text = `
=== PRIVISA EDGE AI MAINTENANCE ADVISORY ===
Advisory ID: ${maintenance?.advisory_id || 'ADV-AUTO'}
Date: ${maintenance?.created_at || new Date().toISOString()}
Machine: ${maintenance?.machine_id || 'Machine 04'}
Defect Detected: ${defectInfo.type} (${(defectInfo.confidence * 100).toFixed(1)}% Confidence)
Probable Component: ${maintenance?.probable_component || rootCause?.probable_component}
Severity / Priority: ${maintenance?.priority || 'HIGH'}
Estimated Urgency: ${maintenance?.estimated_urgency || 'Immediate'}

ROOT CAUSE ANALYSIS:
${maintenance?.root_cause_reasoning || rootCause?.reasoning}

RECOMMENDED CORRECTIVE ACTION:
${maintenance?.recommended_action}
============================================
    `.trim();

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide font-mono flex items-center space-x-2">
                <span>ROOT-CAUSE ANALYSIS & ADVISORY ENGINE</span>
                <span className="text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  AI DIAGNOSTIC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated mechanical telemetry and component attribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-sm">

          {/* 1. Defect Information Grid */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>1. Defect Telemetry</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DEFECT TYPE</span>
                <strong className="text-white text-sm">{defectInfo.type}</strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CONFIDENCE</span>
                <strong className="text-cyan-400 text-sm">{(defectInfo.confidence * 100).toFixed(1)}%</strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SEVERITY</span>
                <strong className="text-red-400 text-sm">{defectInfo.severity || maintenance?.priority || 'HIGH'}</strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 col-span-2">
                <span className="text-slate-500 block text-[10px]">SPATIAL PATTERN</span>
                <span className="text-slate-200 text-xs truncate block font-sans">
                  {defectInfo.pattern || rootCause?.location_pattern || 'Linear longitudinal score'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Root Cause Attribution */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>2. Attributed Root Cause</span>
            </h3>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3.5 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-slate-400">PROBABLE FAULTY COMPONENT:</span>
                <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  {maintenance?.probable_component || rootCause?.probable_component || 'Conveyor Belt Roller #2'}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-sans mt-2">
                {maintenance?.root_cause_reasoning || rootCause?.reasoning || 'Friction seizure on roller bearing causing stock drag along feed.'}
              </p>
            </div>
          </div>

          {/* 3. Maintenance Recommendation */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>3. Automated Maintenance Recommendation</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${priorityColor}`}>
                  PRIORITY: {maintenance?.priority || 'HIGH'}
                </span>
                <span className="px-2 py-0.5 rounded border text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border-slate-700 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{maintenance?.estimated_urgency || 'Immediate'}</span>
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3.5">
              <div className="text-xs font-mono text-emerald-400 font-bold mb-1">RECOMMENDED ACTION:</div>
              <p className="text-slate-200 text-xs font-sans leading-relaxed">
                {maintenance?.recommended_action || 'Inspect and lubricate Conveyor Roller #2 bearings; clean roller surface.'}
              </p>
            </div>
          </div>

          {/* Generated Maintenance Advisory Dispatch Box */}
          {advisoryGenerated && (
            <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-800/60">
                <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs font-bold">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>MAINTENANCE DISPATCH TICKET #{maintenance?.advisory_id || 'ADV-SCR-001'}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded flex items-center space-x-1 transition"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Dispatch'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-cyan-100 whitespace-pre-wrap bg-[#081220] p-3 rounded border border-cyan-900/80">
{`DISPATCH TICKET: ${maintenance?.advisory_id || 'ADV-SCR-001'}
TIMESTAMP:       ${maintenance?.created_at || new Date().toISOString()}
TARGET ASSET:    ${maintenance?.machine_id || 'Machine 04'} -> ${maintenance?.probable_component || 'Conveyor Roller #2'}
URGENCY LEVEL:   ${maintenance?.estimated_urgency || 'Immediate (Next 2 Hours)'}
WORK DIRECTIVE:  ${maintenance?.recommended_action}
STATUS:          DISPATCHED TO SHIFT LEAD MAINTENANCE QUEUE`}
              </pre>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Close
          </button>

          {!advisoryGenerated ? (
            <button
              onClick={() => setAdvisoryGenerated(true)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Maintenance Advisory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCopy}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide flex items-center space-x-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{copied ? 'Dispatched!' : 'Copy Maintenance Ticket'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
