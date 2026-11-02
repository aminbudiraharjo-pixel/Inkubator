import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sliders, 
  LayoutDashboard, 
  History, 
  Activity, 
  Cpu, 
  Flame,
  Droplets
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAlertModal }) {
  const { 
    isConnected,
    latestReading, 
    unreadAlertCount, 
    soundEnabled, 
    setSoundEnabled, 
    activePhase, 
    activeConfig,
    switchPhase
  } = useIncubator();

  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  // Status nyata perangkat hardware ESP32
  const isHardwareOnline = React.useMemo(() => {
    if (!latestReading?.timestamp) return false;
    const rawTs = Number(latestReading.timestamp);
    const diffDirect = Math.abs(now - rawTs);
    const diffWibAdjusted = Math.abs(now - (rawTs - 25200000));
    return Math.min(diffDirect, diffWibAdjusted) / 1000 < 25;
  }, [latestReading?.timestamp, now]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo-smarthatch-clean.png" 
              alt="SMART-HATCH Logo" 
              className="h-10 w-auto object-contain"
            />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              SMART-HATCH
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'charts'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Grafik Analisis</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat & CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Right Status Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Hardware Connection Badge */}
            <div 
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isHardwareOnline 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title={isHardwareOnline ? 'Alat Inkubator Aktif Mengirim Data' : 'Alat Inkubator Sedang Mati / Terputus'}
            >
              {isHardwareOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span>OFF</span>
                </>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Alarm Audio Aktif' : 'Alarm Audio Dimatikan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Alert Bell Button */}
            <button
              onClick={onOpenAlertModal}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
              title="Lihat Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'charts' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Grafik</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'history' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fase</span>
          </button>
        </div>

      </div>
    </header>
  );
}
