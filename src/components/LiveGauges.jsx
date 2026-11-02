import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';

export default function LiveGauges() {
  const { latestReading, activeConfig, lastHeartbeat } = useIncubator();

  // Menampilkan data real terakhir yang dikirim ESP32 ke Firebase
  const temp = latestReading?.temperature !== undefined ? latestReading.temperature : null;
  const hum = latestReading?.humidity !== undefined ? latestReading.humidity : null;

  const tempStatus = latestReading?.temp_status || 'safe';
  const humStatus = latestReading?.humidity_status || 'safe';

  // Config bounds
  const tempMin = activeConfig?.tempMin ?? 37.0;
  const tempMax = activeConfig?.tempMax ?? 38.0;
  const humMin = activeConfig?.humidityMin ?? 55.0;
  const humMax = activeConfig?.humidityMax ?? 65.0;

  // Status Helpers
  const getBadgeStyle = (status) => {
    if (status === 'safe') {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: 'Normal',
        icon: CheckCircle2,
        glow: 'shadow-emerald-500/10'
      };
    }
    if (status.startsWith('warning')) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        label: status === 'warning_high' ? 'Tinggi' : 'Rendah',
        icon: AlertTriangle,
        glow: 'shadow-amber-500/20'
      };
    }
    return {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400 animate-ping',
      label: status === 'danger_high' ? 'Terlalu Panas' : 'Terlalu Dingin',
      icon: AlertOctagon,
      glow: 'shadow-rose-500/30'
    };
  };

  const getHumBadgeStyle = (status) => {
    if (status === 'safe') {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: 'Normal',
        icon: CheckCircle2,
        glow: 'shadow-emerald-500/10'
      };
    }
    if (status.startsWith('warning')) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        label: status === 'warning_high' ? 'Tinggi' : 'Rendah',
        icon: AlertTriangle,
        glow: 'shadow-amber-500/20'
      };
    }
    return {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400 animate-ping',
      label: status === 'danger_high' ? 'Terlalu Basah' : 'Terlalu Kering',
      icon: AlertOctagon,
      glow: 'shadow-rose-500/30'
    };
  };

  const tempBadge = getBadgeStyle(tempStatus);
  const humBadge = getHumBadgeStyle(humStatus);

  // Perhitungan visual gauge percentage
  // Skala Suhu: 35°C to 41°C
  const tempScaleMin = 35.0;
  const tempScaleMax = 41.0;
  const tempPercent = Math.min(100, Math.max(0, ((temp - tempScaleMin) / (tempScaleMax - tempScaleMin)) * 100));

  // Skala Kelembaban: 30% to 95%
  const humScaleMin = 30.0;
  const humScaleMax = 95.0;
  const humPercent = Math.min(100, Math.max(0, ((hum - humScaleMin) / (humScaleMax - humScaleMin)) * 100));

  // Rentang target ideal dalam persentase untuk bar visual
  const tempIdealLeft = ((tempMin - tempScaleMin) / (tempScaleMax - tempScaleMin)) * 100;
  const tempIdealWidth = ((tempMax - tempMin) / (tempScaleMax - tempScaleMin)) * 100;

  const humIdealLeft = ((humMin - humScaleMin) / (humScaleMax - humScaleMin)) * 100;
  const humIdealWidth = ((humMax - humMin) / (humScaleMax - humScaleMin)) * 100;

  const TempIcon = tempBadge.icon;
  const HumIcon = humBadge.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      
      {/* 1. KARTU SUHU REAL-TIME */}
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${tempBadge.glow}`}>
        
        {/* Background Ambient Glow */}
        <div className={`absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl opacity-20 ${
          tempStatus === 'safe' ? 'bg-emerald-500' : tempStatus.startsWith('warning') ? 'bg-amber-500' : 'bg-rose-500'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">
                Suhu
              </h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-slate-300 font-medium">{tempMin} - {tempMax}°C</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tempBadge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${tempBadge.dot}`} />
            <span>{tempBadge.label}</span>
          </div>
        </div>

        {/* Big Value Display */}
        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-['JetBrains_Mono',monospace] text-white">
              {temp !== null ? temp.toFixed(1) : '--.-'}
            </span>
            <span className="text-2xl sm:text-3xl font-semibold text-slate-400">
              °C
            </span>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Deviasi Target</div>
            <div className={`text-sm font-bold font-['JetBrains_Mono',monospace] ${
              temp !== null && Math.abs(temp - (tempMin + tempMax) / 2) <= 0.3 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {temp !== null ? (
                <>
                  {(temp - (tempMin + tempMax) / 2) >= 0 ? '+' : ''}
                  {(temp - (tempMin + tempMax) / 2).toFixed(2)} °C
                </>
              ) : '--'}
            </div>
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1.5">
            <span>{tempScaleMin}°C (Dingin)</span>
            <span className="text-emerald-400 font-semibold">Zona Ideal ({tempMin}-{tempMax}°C)</span>
            <span>{tempScaleMax}°C (Panas)</span>
          </div>

          <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            {/* Ideal Zone Background Highlight */}
            <div 
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
              style={{ left: `${tempIdealLeft}%`, width: `${tempIdealWidth}%` }}
            />
            {/* Current Value Pointer/Bar */}
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                tempStatus === 'safe' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : tempStatus.startsWith('warning') 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                  : 'bg-gradient-to-r from-rose-600 to-red-400 animate-pulse'
              }`}
              style={{ width: `${tempPercent}%` }}
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Fase Aktif: <strong className="text-slate-200">{activeConfig?.name?.split(':')[0] || 'Fase 1'}</strong></span>
          </span>
          <span className="flex items-center space-x-1 font-mono text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{lastHeartbeat ? lastHeartbeat.toLocaleTimeString('id-ID') : 'Menunggu data...'}</span>
          </span>
        </div>

      </div>


      {/* 2. KARTU KELEMBABAN REAL-TIME */}
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${humBadge.glow}`}>
        
        {/* Background Ambient Glow */}
        <div className={`absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl opacity-20 ${
          humStatus === 'safe' ? 'bg-cyan-500' : humStatus.startsWith('warning') ? 'bg-amber-500' : 'bg-rose-500'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">
                Kelembaban
              </h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-slate-300 font-medium">{humMin} - {humMax}%</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${humBadge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${humBadge.dot}`} />
            <span>{humBadge.label}</span>
          </div>
        </div>

        {/* Big Value Display */}
        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-['JetBrains_Mono',monospace] text-white">
              {hum !== null ? hum.toFixed(1) : '--.-'}
            </span>
            <span className="text-2xl sm:text-3xl font-semibold text-slate-400">
              % RH
            </span>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Deviasi Target</div>
            <div className={`text-sm font-bold font-['JetBrains_Mono',monospace] ${
              hum !== null && Math.abs(hum - (humMin + humMax) / 2) <= 3 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {hum !== null ? (
                <>
                  {(hum - (humMin + humMax) / 2) >= 0 ? '+' : ''}
                  {(hum - (humMin + humMax) / 2).toFixed(1)} %
                </>
              ) : '--'}
            </div>
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1.5">
            <span>{humScaleMin}% (Kering)</span>
            <span className="text-cyan-400 font-semibold">Zona Ideal ({humMin}-{humMax}%)</span>
            <span>{humScaleMax}% (Basah)</span>
          </div>

          <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            {/* Ideal Zone Background Highlight */}
            <div 
              className="absolute top-0 bottom-0 bg-cyan-500/20 border-x border-cyan-500/40"
              style={{ left: `${humIdealLeft}%`, width: `${humIdealWidth}%` }}
            />
            {/* Current Value Pointer/Bar */}
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                humStatus === 'safe' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-400' 
                  : humStatus.startsWith('warning') 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                  : 'bg-gradient-to-r from-rose-600 to-red-400 animate-pulse'
              }`}
              style={{ width: `${humPercent}%` }}
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Sensor: <strong className="text-slate-200">DHT11 Digital</strong>
          </span>
          <span className="text-slate-400">
            Device: <span className="font-mono text-slate-300">{latestReading?.device_id || 'esp32-incubator-01'}</span>
          </span>
        </div>

      </div>

    </div>
  );
}
