import React, { useState } from 'react';
import { 
  Sliders, 
  Database, 
  Cpu, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  Server,
  Code,
  SlidersHorizontal
} from 'lucide-react';
import { reseedDatabase } from '../services/api';

export default function Settings({ onDataReset }) {
  const [demoMode, setDemoMode] = useState(true);
  const [modelMode, setModelMode] = useState('simulated'); // 'simulated' or 'yolov8_onnx'
  const [clipLimit, setClipLimit] = useState(2.5);
  const [tileGridSize, setTileGridSize] = useState(8);
  const [reviewLow, setReviewLow] = useState(50);
  const [reviewHigh, setReviewHigh] = useState(80);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const handleReseed = async () => {
    setReseedLoading(true);
    try {
      await reseedDatabase();
      setToastMsg('SQLite database successfully re-seeded with 28 fresh records!');
      setTimeout(() => setToastMsg(null), 3500);
      if (onDataReset) onDataReset();
    } catch (err) {
      alert(`Reseed failed: ${err.message}`);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 font-mono text-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1">
          <Sliders className="w-4 h-4" />
          <span>EDGE SYSTEM PREFERENCES</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          System Configuration & Edge Model Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure demo mode simulation, OpenCV CLAHE parameters, decision confidence thresholds, and test data seeding.
        </p>
      </div>

      {/* Demo Mode & Model Engine Architecture */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Detection Engine & Model Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white font-mono">DEMO SIMULATION MODE</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates realistic surface defect predictions without physical camera hardware.
              </p>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                demoMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-slate-950 transition-all ${
                demoMode ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Model Backend Selector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white font-mono">ACTIVE INFERENCE ENGINE</span>
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                MODULAR
              </span>
            </div>
            <select
              value={modelMode}
              onChange={(e) => setModelMode(e.target.value)}
              className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 outline-none mt-1 cursor-pointer"
            >
              <option value="simulated">EdgeDefect Simulated AI (Default for Hackathon)</option>
              <option value="yolov8_onnx">YOLOv8 ONNX Runtime (Production Interface)</option>
            </select>
          </div>

        </div>

        {/* Drop-in Architecture Guide Alert */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs font-mono text-slate-300 space-y-1.5">
          <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
            <Code className="w-4 h-4" />
            <span>YOLOv8 & ONNX Drop-in Architecture</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            The detector is decoupled via the <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">BaseDefectDetector</code> abstract class in <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">backend/services/detector.py</code>. Simply drop in your trained weights as <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">yolov8_edgedefect.onnx</code> to execute real GPU inference via ONNX Runtime.
          </p>
        </div>
      </div>

      {/* OpenCV CLAHE Default Settings */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>OpenCV CLAHE Illumination Preprocessing Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Clip Limit:</span>
              <strong className="text-cyan-400">{clipLimit}</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.5"
              value={clipLimit}
              onChange={(e) => setClipLimit(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Controls contrast enhancement limitation to prevent noise over-amplification in uniform dark areas.
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Tile Grid Size:</span>
              <strong className="text-cyan-400">{tileGridSize} x {tileGridSize}</strong>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="2"
              value={tileGridSize}
              onChange={(e) => setTileGridSize(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Sets the localized contextual equalization block dimensions for adaptive histogram distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Thresholds & Review Queue Boundaries */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>Confidence Thresholds & Review Routing</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Review Queue Lower Bound:</span>
              <strong className="text-amber-400">{reviewLow}%</strong>
            </div>
            <input
              type="range"
              min="30"
              max="60"
              step="5"
              value={reviewLow}
              onChange={(e) => setReviewLow(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Below {reviewLow}%, predictions are automatically marked PASS as nominal surface variations.
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Review Queue Upper Bound (Auto-Fail):</span>
              <strong className="text-red-400">{reviewHigh}%</strong>
            </div>
            <input
              type="range"
              min="70"
              max="90"
              step="5"
              value={reviewHigh}
              onChange={(e) => setReviewHigh(parseInt(e.target.value, 10))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Above {reviewHigh}%, predictions automatically fail and trigger Root-Cause Analysis.
            </p>
          </div>
        </div>
      </div>

      {/* SQLite Database Maintenance & Re-seed */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold text-white flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>SQLite Demo Persistence Store</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Reset and seed the SQLite database with 28 realistic inspection records across Scratch, Crack, Dent, Discoloration, and clean passes across Machine 01–04.
          </p>
        </div>

        <button
          onClick={handleReseed}
          disabled={reseedLoading}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold rounded-xl border border-cyan-500/40 hover:border-cyan-400 flex items-center space-x-2 transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${reseedLoading ? 'animate-spin' : ''}`} />
          <span>{reseedLoading ? 'Resetting...' : 'Re-Seed Database (28 Records)'}</span>
        </button>
      </div>

    </div>
  );
}
