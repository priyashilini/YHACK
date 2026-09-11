import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Clock, 
  Cpu, 
  Filter, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { getReviewQueue, submitReviewAction } from '../services/api';

export default function ReviewQueue({ onOpenRca, onQueueUpdated }) {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, RESOLVED
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await getReviewQueue();
      setQueueItems(data);
      if (onQueueUpdated) onQueueUpdated(data.filter(d => d.review_status === 'PENDING' || !d.review_status).length);
    } catch (err) {
      console.error('Error fetching review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (inspectionId, action) => {
    setActionLoadingId(inspectionId);
    try {
      await submitReviewAction(inspectionId, action, `Operator manual review: ${action}`);
      setToastMessage(`Inspection ${inspectionId} marked as ${action.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 3000);
      await fetchQueue();
    } catch (err) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = queueItems.filter((item) => {
    if (filter === 'PENDING') return !item.review_status || item.review_status === 'PENDING';
    if (filter === 'RESOLVED') return item.review_status && item.review_status !== 'PENDING';
    return true;
  });

  const pendingCount = queueItems.filter(i => !i.review_status || i.review_status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 font-mono text-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs mb-1">
            <AlertOctagon className="w-4 h-4" />
            <span>HUMAN-IN-THE-LOOP AUTOMATION</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Manual Review Queue (Borderline Confidence: 50% – 80%)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Predictions between 50% and 80% confidence are automatically routed here. Factory operators can validate genuine anomalies, dismiss false alarms, or escalate to engineering.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition ${filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            All ({queueItems.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md transition ${filter === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-md transition ${filter === 'RESOLVED' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Resolved ({queueItems.length - pendingCount})
          </button>
        </div>
      </div>

      {/* Queue Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs bg-[#0f172a] rounded-xl border border-slate-800">
          Loading review queue from SQLite...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs bg-[#0f172a] rounded-xl border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-white font-bold">No items currently in this review filter.</p>
          <p className="text-slate-500">All edge predictions outside 50%-80% have been automatically triaged.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const isPending = !item.review_status || item.review_status === 'PENDING';
            const isConfirmed = item.review_status === 'CONFIRMED';
            const isRejected = item.review_status === 'REJECTED';
            const isEscalated = item.review_status === 'ESCALATED';

            return (
              <div
                key={item.id}
                className={`bg-[#0f172a] border rounded-xl p-5 shadow-xl transition-all ${
                  isPending 
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20' 
                    : 'border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-4 pb-3 mb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="font-bold text-white text-sm">{item.part_id}</span>
                      <span className="text-slate-500">({item.id})</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-1">
                      <span>{item.machine_id}</span>
                      <span>•</span>
                      <span>{item.timestamp ? item.timestamp.replace(' UTC', '') : 'Recent'}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>AWAITING SIGNOFF</span>
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                        CONFIRMED (FAIL)
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        REJECTED (PASS)
                      </span>
                    )}
                    {isEscalated && (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        ESCALATED TO QA
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail & Defect Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Part Image */}
                  <div className="sm:col-span-5 relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] aspect-[4/3]">
                    <img
                      src={item.processed_image_url || item.image_url || '/static/samples/sample_scratch_review.jpg'}
                      alt="Part Surface"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-400">
                      CLAHE VIEW
                    </div>
                  </div>

                  {/* Defect Metrics & Spatial Pattern */}
                  <div className="sm:col-span-7 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Predicted Defect:</span>
                      <strong className="text-white text-sm">{item.defect_type || 'Scratch'}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">AI Confidence:</span>
                      <strong className="text-amber-400 text-sm">{(item.confidence * 100).toFixed(1)}%</strong>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                      <span className="text-slate-500 block text-[9px]">SUSPECTED COMPONENT:</span>
                      <span className="text-cyan-300 font-bold truncate block">
                        {item.root_cause?.probable_component || item.maintenance?.probable_component || 'Linear Guide Rail #4'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Operator Actions: Confirm, Reject, Escalate */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenRca({
                      type: item.defect_type || 'Scratch',
                      confidence: item.confidence,
                      pattern: item.root_cause?.location_pattern,
                      severity: 'MEDIUM'
                    }, item.root_cause, item.maintenance)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
                  >
                    <span>View RCA Telemetry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAction(item.id, 'confirm')}
                      disabled={actionLoadingId === item.id}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-md transition cursor-pointer flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm (Defect)</span>
                    </button>

                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={actionLoadingId === item.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-md transition cursor-pointer flex items-center space-x-1 shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject (False Alarm)</span>
                    </button>

                    <button
                      onClick={() => handleAction(item.id, 'escalate')}
                      disabled={actionLoadingId === item.id}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-md transition cursor-pointer flex items-center space-x-1 shadow-sm"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Escalate</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
