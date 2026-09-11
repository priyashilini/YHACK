import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Zap, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sliders, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  Wrench,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import SideBySideViewer from '../components/SideBySideViewer';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';
import { analyzePart, getSamples } from '../services/api';

export default function ImageAnalysis({ onOpenRca }) {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('sample_scratch_1');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  
  // Pipeline options
  const [applyClahe, setApplyClahe] = useState(true);
  const [clipLimit, setClipLimit] = useState(2.5);
  const [tileGridSize, setTileGridSize] = useState(8);
  const [selectedMachine, setSelectedMachine] = useState('Machine 04');

  // Analysis result & state
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: CLAHE, 3: Detection, 4: RCA

  useEffect(() => {
    getSamples()
      .then((data) => {
        setSamples(data);
        runAnalysis('sample_scratch_1', null);
      })
      .catch((err) => console.error('Error fetching samples:', err));
  }, []);

  const runAnalysis = async (sampleId, file) => {
    setIsLoading(true);
    setCurrentStep(1);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (sampleId) {
        formData.append('sample_id', sampleId);
      }
      formData.append('machine_id', selectedMachine);
      formData.append('apply_clahe', applyClahe ? 'true' : 'false');
      formData.append('clip_limit', clipLimit.toString());
      formData.append('tile_grid_size', tileGridSize.toString());

      setCurrentStep(2); // CLAHE Preprocessing
      const res = await analyzePart(formData);

      setCurrentStep(3); // Defect Detection
      setAnalysisResult(res);

      if (res.root_cause || res.defect_type) {
        setCurrentStep(4); // RCA Complete
      }
    } catch (err) {
      console.error('Analysis error:', err);
      alert(`Inspection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadedPreview(previewUrl);
    setSelectedSample(null);

    runAnalysis(null, file);
  };

  const handleSampleClick = (sId) => {
    setSelectedSample(sId);
    setUploadedFile(null);
    setUploadedPreview(null);
    runAnalysis(sId, null);
  };

  const isPass = analysisResult?.result === 'PASS';
  const isFail = analysisResult?.result === 'FAIL';
  const isReview = analysisResult?.result === 'REVIEW';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Title & Subtitle */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>OPENCV CLAHE & DEEP INSPECTION PIPELINE</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Single-Part Image Analysis & Illumination Equalization
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect parts under challenging lighting conditions. Contrast Limited Adaptive Histogram Equalization (CLAHE) normalizes uneven factory shadows before multi-class defect classification.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Target Machine:</span>
            <select
              value={selectedMachine}
              onChange={(e) => {
                setSelectedMachine(e.target.value);
                if (selectedSample || uploadedFile) {
                  runAnalysis(selectedSample, uploadedFile);
                }
              }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="Machine 04" className="bg-slate-900">Machine 04 (Conveyor Line)</option>
              <option value="Machine 01" className="bg-slate-900">Machine 01 (Stamping Press)</option>
              <option value="Machine 02" className="bg-slate-900">Machine 02 (Annealing Line)</option>
              <option value="Machine 03" className="bg-slate-900">Machine 03 (CNC Milling)</option>
            </select>
          </div>
        </div>

        {/* Pipeline Stepper Visualizer (1 to 9 steps represented cleanly) */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className={`p-2.5 rounded-lg border transition ${
            currentStep >= 1 ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}>
            <span className="block text-[10px] opacity-75">STEP 1</span>
            <strong>1. Ingest Image</strong>
          </div>
          <div className={`p-2.5 rounded-lg border transition ${
            currentStep >= 2 ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}>
            <span className="block text-[10px] opacity-75">STEP 2</span>
            <strong>2. OpenCV CLAHE</strong>
          </div>
          <div className={`p-2.5 rounded-lg border transition ${
            currentStep >= 3 ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}>
            <span className="block text-[10px] opacity-75">STEP 3</span>
            <strong>3. Defect Detection</strong>
          </div>
          <div className={`p-2.5 rounded-lg border transition ${
            currentStep >= 4 ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}>
            <span className="block text-[10px] opacity-75">STEP 4</span>
            <strong>4. Root-Cause Advisory</strong>
          </div>
        </div>
      </div>

      {/* Input Stage: Upload or Sample Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Sample library & Custom Upload */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Custom Upload Dropzone */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Industrial Part Image</span>
            </h3>

            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-900/50 hover:bg-slate-900">
              <Upload className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
              <span className="text-xs font-bold text-white mb-1">
                Click or Drag & Drop Image
              </span>
              <span className="text-[11px] text-slate-400">
                Supports JPG, PNG, TIFF (Industrial Sensor Feeds)
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Preset Sample Library */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Industrial Part Library (Presets)</span>
              <span className="text-[10px] text-cyan-400 font-mono">1-Click Test</span>
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {samples.map((s) => {
                const isSelected = selectedSample === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSampleClick(s.id)}
                    className={`w-full p-3 rounded-lg border text-left font-mono transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-md'
                        : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{s.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.material} • {s.lighting_condition}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.expected_result === 'PASS'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : s.expected_result === 'REVIEW'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {s.expected_result}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CLAHE Parameter Tuning */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg font-mono text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="uppercase text-slate-400 font-bold flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>CLAHE Parameters</span>
              </span>
              <button
                onClick={() => {
                  setClipLimit(2.5);
                  setTileGridSize(8);
                  runAnalysis(selectedSample, uploadedFile);
                }}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Reset Defaults
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Clip Limit (Contrast Threshold):</span>
                <span className="text-cyan-400 font-bold">{clipLimit}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={clipLimit}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setClipLimit(val);
                  runAnalysis(selectedSample, uploadedFile);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Tile Grid Size (Kernel Cells):</span>
                <span className="text-cyan-400 font-bold">{tileGridSize}x{tileGridSize}</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="2"
                value={tileGridSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTileGridSize(val);
                  runAnalysis(selectedSample, uploadedFile);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Right: Side-by-Side CLAHE Comparison & Detection View */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Side-by-Side Comparison: Original vs CLAHE Corrected */}
          {analysisResult && (
            <SideBySideViewer
              originalSrc={analysisResult.original_image_base64 || analysisResult.image_url}
              claheSrc={analysisResult.processed_image_base64 || analysisResult.processed_image_url}
              clipLimit={clipLimit}
              tileGridSize={tileGridSize}
              preprocTime={analysisResult.preprocessing_time_ms || 3.8}
            />
          )}

          {/* Defect Detection & Bounding Box Inspection Stage */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 font-mono text-xs">
              <span className="text-white font-bold flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>SURFACE DEFECT CLASSIFICATION & BOUNDING BOX</span>
              </span>

              <div className="flex items-center space-x-2">
                {isPass && (
                  <span className="px-2.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    PASS // NOMINAL TOLERANCE
                  </span>
                )}
                {isFail && (
                  <span className="px-2.5 py-0.5 rounded font-bold bg-red-950 text-red-300 border border-red-800">
                    FAIL // DEFECT CONFIRMED
                  </span>
                )}
                {isReview && (
                  <span className="px-2.5 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    REVIEW // BORDERLINE (50-80%)
                  </span>
                )}
              </div>
            </div>

            {/* Visual Bounding Box on Enhanced Image */}
            {analysisResult ? (
              <BoundingBoxOverlay
                imageSrc={analysisResult.processed_image_base64 || analysisResult.original_image_base64 || analysisResult.image_url}
                boxes={analysisResult.boxes || []}
                result={analysisResult.result}
                confidence={analysisResult.confidence}
                defectType={analysisResult.defect_type}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                Analyzing surface...
              </div>
            )}

            {/* Analysis Metrics Breakdown */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PREDICTED DEFECT</span>
                <strong className={`text-sm ${
                  isPass ? 'text-emerald-400' : isFail ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {analysisResult?.defect_type || 'None (Pass)'}
                </strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CONFIDENCE SCORE</span>
                <strong className="text-cyan-400 text-sm">
                  {analysisResult ? `${(analysisResult.confidence * 100).toFixed(1)}%` : '94.2%'}
                </strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CLAHE LATENCY</span>
                <strong className="text-slate-300 text-sm">
                  {analysisResult?.preprocessing_time_ms || 3.8}ms
                </strong>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">INFERENCE LATENCY</span>
                <strong className="text-emerald-400 text-sm">
                  {analysisResult?.inference_time_ms || 29.4}ms
                </strong>
              </div>
            </div>
          </div>

          {/* Integrated Root Cause Analysis & Maintenance Advisory */}
          {analysisResult && (isFail || isReview) && (
            <div className="bg-gradient-to-br from-[#0f172a] to-[#121c32] border border-red-500/30 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      Automated Root-Cause Analysis (RCA)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Machine component attribution based on defect spatial pattern
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenRca({
                    type: analysisResult.defect_type,
                    confidence: analysisResult.confidence,
                    pattern: analysisResult.location_pattern,
                    severity: analysisResult.maintenance?.priority || 'HIGH'
                  }, analysisResult.root_cause, analysisResult.maintenance)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Maintenance Advisory</span>
                </button>
              </div>

              {/* RCA Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                
                {/* Probable Cause */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">PROBABLE FAULTY COMPONENT:</div>
                  <div className="text-amber-400 font-bold text-sm mb-2">
                    {analysisResult.root_cause?.probable_component || analysisResult.maintenance?.probable_component || 'Conveyor Belt Roller #2'}
                  </div>
                  <div className="text-slate-300 font-sans text-xs leading-relaxed">
                    {analysisResult.root_cause?.reasoning || analysisResult.maintenance?.root_cause_reasoning}
                  </div>
                </div>

                {/* Maintenance Recommendation */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">RECOMMENDED ACTION:</span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.2 rounded border border-red-800">
                      {analysisResult.maintenance?.priority || 'HIGH'} PRIORITY
                    </span>
                  </div>
                  <div className="text-emerald-400 font-bold text-sm mb-2">
                    Corrective Work Directive
                  </div>
                  <div className="text-slate-300 font-sans text-xs leading-relaxed">
                    {analysisResult.maintenance?.recommended_action || 'Inspect and lubricate Conveyor Roller #2.'}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
