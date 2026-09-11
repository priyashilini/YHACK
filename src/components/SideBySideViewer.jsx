import React, { useState } from 'react';
import { Columns, SplitSquareVertical, Sliders, Zap } from 'lucide-react';

export default function SideBySideViewer({
  originalSrc,
  claheSrc,
  clipLimit = 2.5,
  tileGridSize = 8,
  preprocTime = 3.8
}) {
  const [viewMode, setViewMode] = useState('sideBySide'); // 'sideBySide' or 'slider'
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono uppercase font-bold text-slate-300 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Illumination Normalization (OpenCV CLAHE)</span>
          </span>
          <span className="bg-cyan-950 text-cyan-400 font-mono px-2 py-0.5 rounded text-[11px] border border-cyan-800">
            {preprocTime}ms
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2 font-mono text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span>ClipLimit: <strong className="text-cyan-400">{clipLimit}</strong></span>
            <span>•</span>
            <span>TileGrid: <strong className="text-cyan-400">{tileGridSize}x{tileGridSize}</strong></span>
          </div>

          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                viewMode === 'sideBySide'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                viewMode === 'slider'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'sideBySide' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Original Image */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16]">
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
              ORIGINAL (RAW CAMERA FEED)
            </div>
            <img
              src={originalSrc}
              alt="Raw Surface"
              className="w-full h-auto object-cover block"
            />
            <div className="p-2.5 bg-[#0d1424] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Harsh shadows / Specular glares present</span>
              <span className="font-mono text-slate-500">RGB 640x440</span>
            </div>
          </div>

          {/* Right: CLAHE Enhanced Image */}
          <div className="relative rounded-lg overflow-hidden border border-cyan-800/60 bg-[#090d16] shadow-lg shadow-cyan-950/20">
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-600/80 text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>CLAHE NORMALIZED (LAB SPACE)</span>
            </div>
            <img
              src={claheSrc}
              alt="CLAHE Surface"
              className="w-full h-auto object-cover block"
            />
            <div className="p-2.5 bg-[#0d1424] border-t border-slate-800 text-[11px] text-cyan-400/90 flex items-center justify-between">
              <span>Illumination equalized • Defect contrast magnified</span>
              <span className="font-mono text-cyan-400">OpenCV v5.0</span>
            </div>
          </div>
        </div>
      ) : (
        /* Split Comparison Slider */
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] select-none h-72 sm:h-96">
          {/* Under image (Original) */}
          <img
            src={originalSrc}
            alt="Original"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300">
            ORIGINAL FEED
          </div>

          {/* Over image (CLAHE) with clip-path */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          >
            <img
              src={claheSrc}
              alt="CLAHE Enhanced"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-600 text-xs font-mono text-cyan-300">
              CLAHE NORMALIZED
            </div>
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-lg cursor-ew-resize z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
              ↔
            </div>
          </div>

          {/* Hidden range input for interactive dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
