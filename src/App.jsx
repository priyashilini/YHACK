import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LiveInspection from './pages/LiveInspection';
import ImageAnalysis from './pages/ImageAnalysis';
import ReviewQueue from './pages/ReviewQueue';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import RcaModal from './components/RcaModal';

import { 
  getHealth, 
  getAnalytics, 
  getMachines, 
  getInspections, 
  getReviewQueue 
} from './services/api';
import { INITIAL_ANALYTICS, INITIAL_MACHINES } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [analytics, setAnalytics] = useState(INITIAL_ANALYTICS);
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [recentInspections, setRecentInspections] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);

  // Root-Cause Analysis modal state
  const [rcaModal, setRcaModal] = useState({
    isOpen: false,
    defectInfo: null,
    rootCause: null,
    maintenance: null
  });

  // Fetch all core system data from FastAPI backend
  const refreshSystemData = useCallback(async () => {
    try {
      // 1. Health check
      await getHealth();
      setIsOnline(true);

      // 2. Fetch analytics
      const aData = await getAnalytics();
      setAnalytics(aData);

      // 3. Fetch machines
      const mData = await getMachines();
      setMachines(mData);

      // 4. Fetch recent inspections
      const iData = await getInspections({ limit: 50 });
      setRecentInspections(iData);

      // 5. Fetch review queue count
      const rData = await getReviewQueue();
      const pending = rData.filter(i => !i.review_status || i.review_status === 'PENDING').length;
      setReviewCount(pending);
    } catch (err) {
      console.warn('Backend currently unreachable, using client cached data:', err.message);
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    refreshSystemData();
    // Background polling for fresh analytics
    const interval = setInterval(refreshSystemData, 6000);
    return () => clearInterval(interval);
  }, [refreshSystemData]);

  const handleOpenRca = (defectInfo, rootCause, maintenance) => {
    setRcaModal({
      isOpen: true,
      defectInfo,
      rootCause,
      maintenance
    });
  };

  const handleCloseRca = () => {
    setRcaModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSelectInspection = (item) => {
    if (item.root_cause || item.maintenance) {
      handleOpenRca(
        {
          type: item.defect_type || 'Defect Anomaly',
          confidence: item.confidence,
          pattern: item.root_cause?.location_pattern,
          severity: item.maintenance?.priority || 'HIGH'
        },
        item.root_cause,
        item.maintenance
      );
    } else {
      handleOpenRca(
        {
          type: item.defect_type || 'Surface Anomaly',
          confidence: item.confidence,
          pattern: 'Longitudinal surface defect',
          severity: 'HIGH'
        },
        {
          probable_component: 'Conveyor Belt Roller #2',
          reasoning: 'Mechanical friction wear detected.'
        },
        {
          advisory_id: `ADV-${item.id.slice(-6)}`,
          machine_id: item.machine_id,
          probable_component: 'Conveyor Belt Roller #2',
          root_cause_reasoning: 'Roller friction scoring detected.',
          recommended_action: 'Inspect and lubricate Conveyor Roller #2 bearings.',
          priority: 'CRITICAL',
          estimated_urgency: 'Immediate (Next 2 Hours)',
          created_at: item.timestamp
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans industrial-grid">
      {/* Industrial Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviewCount={reviewCount}
        isOnline={isOnline}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            analytics={analytics}
            machines={machines}
            recentInspections={recentInspections}
            onNavigate={setActiveTab}
            onSelectInspection={handleSelectInspection}
          />
        )}

        {activeTab === 'live' && (
          <LiveInspection
            onOpenRca={handleOpenRca}
            onRefreshData={refreshSystemData}
          />
        )}

        {activeTab === 'analysis' && (
          <ImageAnalysis
            onOpenRca={handleOpenRca}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueue
            onOpenRca={handleOpenRca}
            onQueueUpdated={setReviewCount}
          />
        )}

        {activeTab === 'maintenance' && (
          <Maintenance
            machines={machines}
            onOpenAdvisory={handleOpenRca}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            analytics={analytics}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            onDataReset={refreshSystemData}
          />
        )}
      </main>

      {/* Persistent Root Cause Analysis Modal */}
      <RcaModal
        isOpen={rcaModal.isOpen}
        onClose={handleCloseRca}
        defectInfo={rcaModal.defectInfo}
        rootCause={rcaModal.rootCause}
        maintenance={rcaModal.maintenance}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f1d] py-3 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PRIVISA – EdgeDefect AI © 2026 // Intelligent Industrial Surface Inspection</span>
          <span className="text-cyan-400/80">Edge Detection: Scratch • Crack • Dent • Discoloration</span>
        </div>
      </footer>
    </div>
  );
}
