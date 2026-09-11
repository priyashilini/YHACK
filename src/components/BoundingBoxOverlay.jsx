import React from 'react';

export default function BoundingBoxOverlay({
  imageSrc,
  boxes = [],
  result = 'PASS',
  confidence = 0.95,
  defectType = null,
  showReticles = true,
  className = ''
}) {
  const isPass = result === 'PASS';
  const isFail = result === 'FAIL';
  const isReview = result === 'REVIEW';

  const getBoxColor = (boxConf, label) => {
    if (boxConf >= 0.80) return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-400', badge: 'bg-red-950/90 text-red-300 border-red-500' };
    if (boxConf >= 0.50) return { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-950/90 text-amber-300 border-amber-500' };
    return { border: 'border-cyan-500', bg: 'bg-cyan-500/20', text: 'text-cyan-400', badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-500' };
  };

  return (
    <div className={`relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] select-none ${className}`}>
      {/* Target inspection background image */}
      <img
        src={imageSrc}
        alt="Inspected Surface"
        className="w-full h-auto object-cover block"
      />

      {/* Industrial Reticle Overlay */}
      {showReticles && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Center alignment crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none opacity-30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-cyan-400"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-0.5 bg-cyan-400"></div>
            <div className="absolute inset-1 border border-cyan-400 rounded-full"></div>
          </div>

          {/* Corner frame markers */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>

          {/* Telemetry watermark */}
          <div className="absolute top-3 left-9 text-[10px] font-mono text-cyan-400/70 tracking-wider">
            OPTICAL CAM 01 // 640x440 RAW
          </div>
        </div>
      )}

      {/* Defect Bounding Boxes */}
      {boxes && boxes.map((box, idx) => {
        const style = getBoxColor(box.confidence, box.label);
        const leftPercent = `${(box.x * 100).toFixed(1)}%`;
        const topPercent = `${(box.y * 100).toFixed(1)}%`;
        const widthPercent = `${(box.width * 100).toFixed(1)}%`;
        const heightPercent = `${(box.height * 100).toFixed(1)}%`;

        return (
          <div
            key={idx}
            className={`absolute border-2 ${style.border} ${style.bg} transition-all duration-300 animate-pulse-slow`}
            style={{
              left: leftPercent,
              top: topPercent,
              width: widthPercent,
              height: heightPercent,
            }}
          >
            {/* Box corner notches */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white"></div>

            {/* Label and confidence floating pill */}
            <div className={`absolute -top-7 left-0 flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[11px] font-mono font-bold whitespace-nowrap shadow-lg ${style.badge}`}>
              <span>{box.label || defectType}</span>
              <span className="opacity-75">
                {(box.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}

      {/* Decision Status Stamp */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        {isPass && (
          <div className="px-3 py-1 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 rounded font-mono font-black text-xs tracking-wider flex items-center space-x-1.5 shadow-lg glow-green">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>PASS // TOLERANCE OK</span>
          </div>
        )}
        {isFail && (
          <div className="px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-300 rounded font-mono font-black text-xs tracking-wider flex items-center space-x-1.5 shadow-lg glow-red">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span>FAIL // {defectType?.toUpperCase() || 'DEFECT'}</span>
          </div>
        )}
        {isReview && (
          <div className="px-3 py-1 bg-amber-950/90 border border-amber-500/80 text-amber-300 rounded font-mono font-black text-xs tracking-wider flex items-center space-x-1.5 shadow-lg glow-amber">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>REVIEW QUEUE // BORDERLINE</span>
          </div>
        )}
      </div>
    </div>
  );
}
