import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Flame, 
  Snowflake, 
  Droplets, 
  Droplet, 
  Check, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Gauge
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';

export default function SimulatorControl() {
  const { simulatorState, toggleSimulator, setSimulatorScenario } = useIncubator();
  const [isExpanded, setIsExpanded] = useState(false);
  const [intervalMs, setIntervalMs] = useState(2500);

  const isRunning = simulatorState?.isRunning;
  const currentMode = simulatorState?.currentMode || 'normal';

  const handleToggle = () => {
    toggleSimulator(!isRunning, intervalMs);
  };

  const handleModeChange = (mode) => {
    setSimulatorScenario(mode);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      
      {/* Floating Pill / Collapsed Trigger */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300">
        
        {/* Toggle Header Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${
              isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200">Simulator IoT Sensor</span>
                <span className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`} />
              </div>
              <p className="text-[10px] text-slate-400">
                {isRunning ? `Aktif (${currentMode})` : 'Mati / Hardware Fisik'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isRunning 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Mock</span>
                </>
              )}
            </button>

            <button className="text-slate-400 hover:text-slate-200 p-1">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Controls Drawer */}
        {isExpanded && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3.5 w-80 sm:w-96 animate-fadeIn">
            
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Skenario Uji Coba Inkubator:
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                
                {/* 1. Normal Mode */}
                <button
                  onClick={() => handleModeChange('normal')}
                  className={`p-2 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all ${
                    currentMode === 'normal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-emerald-400 font-bold">🌿</span>
                  <span>Normal Stabil</span>
                </button>

                {/* 2. Overheat Spike */}
                <button
                  onClick={() => handleModeChange('spike_overheat')}
                  className={`p-2 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all ${
                    currentMode === 'spike_overheat'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Panas Spike (&gt;39°C)</span>
                </button>

                {/* 3. Cold Drop */}
                <button
                  onClick={() => handleModeChange('drop_cold')}
                  className={`p-2 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all ${
                    currentMode === 'drop_cold'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                  <span>Suhu Dingin (&lt;36°C)</span>
                </button>

                {/* 4. Dry Drop */}
                <button
                  onClick={() => handleModeChange('drop_dry')}
                  className={`p-2 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all ${
                    currentMode === 'drop_dry'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kering / Air Habis</span>
                </button>

                {/* 5. Humid Spike */}
                <button
                  onClick={() => handleModeChange('spike_humid')}
                  className={`col-span-2 p-2 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all ${
                    currentMode === 'spike_humid'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kelembaban Tinggi (&gt;85% RH)</span>
                </button>

              </div>
            </div>

            {/* Interval speed selector */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Kecepatan Emit Data:</span>
              <div className="flex items-center space-x-1 font-mono">
                {[1000, 2500, 5000].map(ms => (
                  <button
                    key={ms}
                    onClick={() => {
                      setIntervalMs(ms);
                      if (isRunning) toggleSimulator(true, ms);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      intervalMs === ms ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
