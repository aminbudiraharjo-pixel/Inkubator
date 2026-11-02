import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Flame,
  AlertTriangle,
  AlertOctagon,
  BellRing,
  Volume2,
  VolumeX,
  RotateCw,
  Calendar,
  Egg
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';

export default function StatusSummary() {
  const { latestReading, triggerBuzzerSound, soundEnabled, setSoundEnabled, currentDay, daysUntilHatch } = useIncubator();
  const [now, setNow] = React.useState(Date.now());

  // Perbarui waktu setiap 2 detik agar status otomatis berganti ke OFF saat alat dimatikan
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const temp = latestReading?.temperature;
  const hum = latestReading?.humidity;
  const isLampuOn = latestReading?.lamp_on;
  const isMotorOn = latestReading?.motor_on;

  // Deteksi status nyata alat:
  // ESP32 mengirim timestamp dengan offset GMT+7 (+25200 detik) atau UTC murni.
  // Kita hitung selisih waktu mutlak terkecil untuk mencegah bug offset zona waktu.
  const isHardwareOnline = React.useMemo(() => {
    if (!latestReading?.timestamp) return false;
    const rawTs = Number(latestReading.timestamp);
    const diffDirect = Math.abs(now - rawTs);
    const diffWibAdjusted = Math.abs(now - (rawTs - 25200000));
    const minDiffSeconds = Math.min(diffDirect, diffWibAdjusted) / 1000;

    // Alat dianggap online jika mengirim data dalam 25 detik terakhir (ESP32 mengirim setiap 5 detik)
    return minDiffSeconds < 25;
  }, [latestReading?.timestamp, now]);

  const isOnline = isHardwareOnline;

  // Analisis Kondisi Ekstrem Ringkas
  let emergency = null;
  if (isOnline && temp !== undefined && hum !== undefined) {
    if (temp >= 39.8) {
      emergency = {
        title: 'Suhu Terlalu Panas (≥ 39.8°C)',
        action: 'Buka sedikit ventilasi inkubator.',
        type: 'danger'
      };
    } else if (hum < 40.0) {
      emergency = {
        title: 'Kelembaban Kering (< 40%)',
        action: 'Isi air pada baki inkubator.',
        type: 'warning'
      };
    } else if (hum > 85.0) {
      emergency = {
        title: 'Kelembaban Tinggi (> 85%)',
        action: 'Kurangi air pada baki.',
        type: 'warning'
      };
    }
  }

  return (
    <div className="space-y-4">

      {/* Tracker Siklus Penetasan Telur Bebek (28 Hari) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              currentDay >= 25 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
            }`}>
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-base">Hari ke-{currentDay} dari 28</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  currentDay >= 25
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}>
                  {currentDay >= 25 ? 'Fase Menetas (Hatcher)' : 'Fase Pengeraman (Setter)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentDay >= 25 
                  ? 'Fase kritis: Rak pemutar dimatikan, jaga kelembaban tinggi 65-70%.' 
                  : 'Fase inkubasi: Rak pemutar aktif rutin, kelembaban 55-65%.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-right self-end sm:self-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">
              {daysUntilHatch > 0 ? `${daysUntilHatch} hari lagi menuju menetas` : 'Waktunya Menetas!'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              currentDay >= 25 
                ? 'bg-gradient-to-r from-cyan-500 to-amber-400' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-400'
            }`}
            style={{ width: `${Math.min(100, Math.round((currentDay / 28) * 100))}%` }}
          />
        </div>
      </div>

      {/* Banner Notifikasi Tindakan Darurat Ekstrem */}
      {emergency && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${emergency.type === 'danger'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 animate-pulse'
            : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}>
          <div className="flex items-start space-x-3.5">
            <div className={`p-2 rounded-xl mt-0.5 ${emergency.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
              {emergency.type === 'danger' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                {emergency.title}
              </h4>
              <p className="text-xs font-semibold mt-1">
                {emergency.action}
              </p>
            </div>
          </div>

          {/* Tombol Uji & Status Buzzer Langsung di Banner */}
          <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
            <button
              onClick={() => triggerBuzzerSound('danger')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Putar Bunyi Simulasi Buzzer"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
              <span>Bunyikan Buzzer</span>
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title={soundEnabled ? "Mute Suara Web" : "Nyalakan Suara Web"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      )}

      {/* Grid Status Ringkas 4 Kolom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* 1. Status Lampu Pemanas */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isLampuOn
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${isLampuOn ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Pemanas</div>
              <div className="text-sm font-semibold text-white">
                {isLampuOn ? 'Menyala' : 'Padam'}
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${isLampuOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
            {isLampuOn ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* 2. Status Motor Rak Telur */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isMotorOn
            ? 'bg-purple-950/30 border-purple-500/40 text-purple-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${isMotorOn ? 'bg-purple-500/20 text-purple-400 animate-spin' : 'bg-slate-800 text-slate-500'}`}>
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Rak Telur</div>
              <div className="text-sm font-semibold text-white">
                {isMotorOn ? 'Berputar' : 'Diam'}
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${isMotorOn ? 'bg-purple-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
            {isMotorOn ? 'PUTAR' : 'STANDBY'}
          </span>
        </div>

        {/* 3. Status Alarm Buzzer */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${emergency
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${emergency ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Buzzer</div>
              <div className="text-sm font-semibold text-white">
                {emergency ? 'Berbunyi' : 'Normal'}
              </div>
            </div>
          </div>
          <button
            onClick={() => triggerBuzzerSound(emergency ? 'danger' : 'warning')}
            className={`px-2 py-0.5 text-xs font-semibold rounded border transition-all cursor-pointer ${emergency
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
          >
            {emergency ? 'Alarm' : 'Uji'}
          </button>
        </div>

        {/* 4. Status Perangkat (Online / OFF) */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isOnline
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-rose-950/20 border-rose-500/30'
          }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
              {isOnline ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs text-slate-400">Status Alat</div>
              <div className={`text-sm font-semibold ${isOnline ? 'text-white' : 'text-slate-400'}`}>
                {isOnline ? 'Terhubung' : 'Offline'}
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-bold rounded border ${isOnline
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
            {isOnline ? 'ONLINE' : 'OFF'}
          </span>
        </div>

      </div>
    </div>
  );
}
