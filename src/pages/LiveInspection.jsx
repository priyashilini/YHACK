import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Upload, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sliders, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';
import { inspectLivePart, getSamples } from '../services/api';

export default function LiveInspection({
  onOpenRca,
  onRefreshData
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [applyClahe, setApplyClahe] = useState(true);
  const [currentPart, setCurrentPart] = useState(null);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [samples, setSamples] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('Machine 04');
  const [speedMs, setSpeedMs] = useState(2400); // cycle duration in ms
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const timerRef = useRef(null);

  // Load sample parts catalog on mount
  useEffect(() => {
    getSamples()
      .then((data) => {
        setSamples(data);
        // Default initial part: Scratch on Machine 04 (Conveyor Roller #2)
        const initial = data.find(s => s.id === 'sample_scratch_1') || data[0];
        if (initial) {
          runSingleInspection(initial.id);
        }
      })
      .catch((err) => console.error('Error loading samples:', err));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Continuous inspection loop when started
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        triggerNextConveyorPart();
      }, speedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speedMs, applyClahe, selectedMachine]);

  const triggerNextConveyorPart = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // Pick random sample from available pool
      const pool = [
        'sample_scratch_1',
        'sample_clean_1',
        'sample_crack_1',
        'sample_clean_2',
        'sample_dent_1',
        'sample_discolor_1',
        'sample_scratch_review'
      ];
      const sampleId = pool[Math.floor(Math.random() * pool.length)];

      const formData = new FormData();
      formData.append('sample_id', sampleId);
      formData.append('machine_id', selectedMachine);
      formData.append('apply_clahe', applyClahe ? 'true' : 'false');

      const result = await inspectLivePart(formData);
      setCurrentPart(result);
      setInspectionHistory((prev) => [result, ...prev.slice(0, 19)]);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Inspection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runSingleInspection = async (sampleId) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('sample_id', sampleId);
      formData.append('machine_id', selectedMachine);
      formData.append('apply_clahe', applyClahe ? 'true' : 'false');

      const result = await inspectLivePart(formData);
      setCurrentPart(result);
      setInspectionHistory((prev) => [result, ...prev.slice(0, 19)]);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Single inspection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machine_id', selectedMachine);
      formData.append('apply_clahe', applyClahe ? 'true' : 'false');

      const result = await inspectLivePart(formData);
      setCurrentPart(result);
      setInspectionHistory((prev) => [result, ...prev.slice(0, 19)]);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Upload inspection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setFileInputKey(Date.now());
    }
  };

  const isFail = currentPart?.result === 'FAIL';
  const isPass = currentPart?.result === 'PASS';
  const isReview = currentPart?.result === 'REVIEW';

  return (
    <div className="space-y-6 pb-12">

      {/* Conveyor Control Command Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Conveyor Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs tracking-wider rounded-lg shadow-lg shadow-emerald-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START INSPECTION</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-bold text-xs tracking-wider rounded-lg shadow-lg shadow-red-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>STOP INSPECTION</span>
            </button>
          )}

          <button
            onClick={triggerNextConveyorPart}
            disabled={isRunning || isProcessing}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-mono text-xs rounded-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Step Next Part</span>
          </button>

          {/* Real OpenCV Lighting Correction Toggle */}
          <button
            onClick={() => setApplyClahe(!applyClahe)}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-mono font-bold border transition flex items-center space-x-2 cursor-pointer ${
              applyClahe
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-950/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-4 h-4 ${applyClahe ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-500'}`} />
            <span>Lighting Correction (CLAHE): {applyClahe ? 'ON' : 'OFF'}</span>
          </button>

          {/* Upload Custom Image Button */}
          <label className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Image</span>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Right: Station selector & simulation speed */}
        <div className="flex items-center space-x-3 font-mono text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Machine Feed:</span>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="Machine 04" className="bg-slate-900">Machine 04 (Conveyor Line)</option>
              <option value="Machine 01" className="bg-slate-900">Machine 01 (Stamping Press)</option>
              <option value="Machine 02" className="bg-slate-900">Machine 02 (Annealing Cell)</option>
              <option value="Machine 03" className="bg-slate-900">Machine 03 (CNC Milling)</option>
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Cycle Speed:</span>
            <span className="text-cyan-400 font-bold">{(speedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

      </div>

      {/* Main Conveyor Inspection Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Center-Left: High-Definition Inspection Viewport */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-2xl relative overflow-hidden">
            
            {/* Top Viewport Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-500'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                </span>
                <span className="text-white font-bold">
                  {isRunning ? 'CONVEYOR STREAM ACTIVE' : 'CONVEYOR STATIONARY (READY)'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">FRAME #09421</span>
              </div>

              <div className="flex items-center space-x-3 text-slate-400">
                <span>CLAHE: <strong className={applyClahe ? 'text-cyan-400' : 'text-slate-500'}>{applyClahe ? 'APPLIED (LAB)' : 'BYPASS'}</strong></span>
                <span>•</span>
                <span>LATENCY: <strong className="text-emerald-400">{currentPart?.total_processing_time_ms || 34.2}ms</strong></span>
              </div>
            </div>

            {/* Industrial Part Visual Frame with Animated Scanner */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] group">
              
              {/* Laser Scanning Line Animation when active */}
              {(isRunning || isProcessing) && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-30 pointer-events-none animate-bounce opacity-80 shadow-[0_0_15px_#22d3ee]"></div>
              )}

              {/* Bounding Box Overlay Image */}
              {currentPart ? (
                <BoundingBoxOverlay
                  imageSrc={currentPart.original_image_base64 || currentPart.image_url || '/static/samples/sample_scratch_1.jpg'}
                  boxes={currentPart.boxes || []}
                  result={currentPart.result}
                  confidence={currentPart.confidence}
                  defectType={currentPart.defect_type}
                  showReticles={true}
                />
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500 font-mono">
                  Loading inspection camera feed...
                </div>
              )}

              {/* Conveyor Belt Roller Graphic at Bottom */}
              <div className="h-4 bg-[#080d1a] border-t border-slate-800 flex items-center justify-around overflow-hidden">
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-2 rounded-full ${isRunning ? 'bg-cyan-500/40 animate-pulse' : 'bg-slate-700/40'}`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Telemetry Strip Under Inspection Camera */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PART IDENTIFIER</span>
                <span className="text-white font-bold text-sm truncate block">
                  {currentPart?.part_id || 'PRV-ST-8812'}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DEFECT CLASSIFICATION</span>
                <span className={`font-bold text-sm ${
                  isPass ? 'text-emerald-400' : isFail ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {currentPart?.defect_type || 'Nominal Surface'}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MODEL CONFIDENCE</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {currentPart ? `${(currentPart.confidence * 100).toFixed(1)}%` : '94.2%'}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">INSPECTION DECISION</span>
                <span className={`font-bold text-sm ${
                  isPass ? 'text-emerald-400' : isFail ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {currentPart?.result || 'FAIL'}
                </span>
              </div>
            </div>

            {/* If Defect Detected: Direct RCA Callout Banner (Crucial for 2-min demo pitch!) */}
            {currentPart && (isFail || isReview) && (
              <div className="mt-4 bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/60 border border-red-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono uppercase font-bold text-red-300">
                      Defect Anomaly Detected // {currentPart.defect_type} ({((currentPart.confidence || 0) * 100).toFixed(1)}%)
                    </h4>
                    <p className="text-xs text-slate-300 font-sans">
                      Attributed to: <strong className="text-amber-300 font-mono">{currentPart.root_cause?.probable_component || currentPart.maintenance?.probable_component || 'Conveyor Belt Roller #2'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenRca({
                    type: currentPart.defect_type,
                    confidence: currentPart.confidence,
                    pattern: currentPart.location_pattern,
                    severity: currentPart.maintenance?.priority || 'HIGH'
                  }, currentPart.root_cause, currentPart.maintenance)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-red-950 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap"
                >
                  <span>Generate Root Cause Advisory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          {/* 1-Click Sample Part Switcher */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Quick Inject Sample Part (Demo Mode)</span>
              <span className="text-cyan-400 text-[10px]">Click any item to inspect</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {samples.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => runSingleInspection(s.id)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition cursor-pointer group"
                >
                  <span className="text-[11px] font-mono text-cyan-400 block font-semibold truncate group-hover:text-cyan-300">
                    {s.name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{s.defect_type || 'Nominal'}</span>
                    <span className={s.expected_result === 'PASS' ? 'text-emerald-400' : 'text-red-400'}>
                      {s.expected_result}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Live Conveyor Telemetry Event Log */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Live Telemetry Audit Feed</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {inspectionHistory.length} Parts Processed
              </span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {inspectionHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  Awaiting conveyor start...
                </div>
              ) : (
                inspectionHistory.map((item, idx) => {
                  const pass = item.result === 'PASS';
                  const fail = item.result === 'FAIL';
                  const rev = item.result === 'REVIEW';

                  return (
                    <div
                      key={idx}
                      onClick={() => (fail || rev) && onOpenRca({
                        type: item.defect_type,
                        confidence: item.confidence,
                        pattern: item.location_pattern,
                        severity: item.maintenance?.priority || 'HIGH'
                      }, item.root_cause, item.maintenance)}
                      className={`p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        fail ? 'bg-red-950/20 border-red-900/40 hover:border-red-500/50' :
                        rev ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-500/50' :
                        'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{item.part_id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          fail ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.result}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.defect_type || 'Surface Nominal'}</span>
                        <span className="text-cyan-400 font-bold">{(item.confidence * 100).toFixed(1)}%</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{item.machine_id}</span>
                        <span>{item.total_processing_time_ms || item.processing_time_ms}ms</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Buffer: Ring FIFO</span>
            <span className="text-cyan-400">Real-time SQLite Sync</span>
          </div>

        </div>

      </div>

    </div>
  );
}
