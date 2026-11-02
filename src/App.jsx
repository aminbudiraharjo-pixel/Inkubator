import React, { useState } from 'react';
import { IncubatorProvider, useIncubator } from './context/IncubatorContext';
import Navbar from './components/Navbar';
import LiveGauges from './components/LiveGauges';
import StatusSummary from './components/StatusSummary';
import RealtimeCharts from './components/RealtimeCharts';
import HistoryTable from './components/HistoryTable';
import SettingsView from './components/SettingsView';
import AlertNotification from './components/AlertNotification';
import { 
  Egg, 
  Activity, 
  History, 
  Sliders, 
  Wifi, 
  Sparkles, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'charts', 'history', 'settings'
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const { activePhase, activeConfig, isConnected, latestReading } = useIncubator();

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: DASHBOARD UTAMA */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status & Farming Advice Banner */}
            <StatusSummary />

            {/* Live Sensor Gauges (Big Numbers + Range) */}
            <LiveGauges />

            {/* Realtime Trend Chart */}
            <RealtimeCharts />
          </div>
        )}

        {/* TAB 2: GRAFIK */}
        {activeTab === 'charts' && (
          <div className="space-y-6 animate-fadeIn">
            <RealtimeCharts />
            <StatusSummary />
          </div>
        )}

        {/* TAB 3: RIWAYAT */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            <HistoryTable />
          </div>
        )}

        {/* TAB 4: PENGATURAN */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            <SettingsView />
          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 mt-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo-smarthatch-clean.png" alt="SMART-HATCH" className="h-5 w-auto object-contain" />
            <span className="font-medium text-slate-400">SMART-HATCH Inkubator</span>
          </div>
          <span className="text-slate-500 text-[11px]">Sistem Monitoring Realtime</span>
        </div>
      </footer>

      {/* 4. Pop-up Modal Alert Notification Center */}
      <AlertNotification 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <IncubatorProvider>
      <DashboardContent />
    </IncubatorProvider>
  );
}
