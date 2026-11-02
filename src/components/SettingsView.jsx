import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle2, 
  Save, 
  Clock,
  Volume2,
  Timer,
  RotateCcw,
  Trash2,
  Power,
  AlertTriangle,
  Wifi,
  WifiOff,
  Calendar,
  Egg
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';
import { api } from '../services/api';

export default function SettingsView() {
  const { activeConfig, latestReading, refreshSettings, currentDay, daysUntilHatch, resetBatchTracking } = useIncubator();

  const [form, setForm] = useState({
    tempMin: 37.0,
    tempMax: 39.0,
    humidityMin: 55.0,
    humidityMax: 65.0,
    turnMode: 'interval_4x', // 'interval_2x', 'interval_3x', 'interval_4x', 'custom_hours'
    turnIntervalHours: 6,
    turnDurationSeconds: 4, // Default 4 detik
    customStartHour: 6,
    buzzerEnabled: true
  });

  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isResettingFirebase, setIsResettingFirebase] = useState(false);
  const [isResettingBatch, setIsResettingBatch] = useState(false);
  const [manualStartDay, setManualStartDay] = useState(1);
  const [wifiForm, setWifiForm] = useState({ ssid: '', password: '' });
  const [isSavingWifi, setIsSavingWifi] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Interval re-render 2 detik agar status hardware online/mati langsung terbarui
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  // Deteksi akurat apakah hardware ESP32 aktif dengan toleransi offset waktu
  const isHardwareOnline = React.useMemo(() => {
    if (!latestReading?.timestamp) return false;
    const rawTs = Number(latestReading.timestamp);
    const diffDirect = Math.abs(now - rawTs);
    const diffWibAdjusted = Math.abs(now - (rawTs - 25200000));
    return Math.min(diffDirect, diffWibAdjusted) / 1000 < 25;
  }, [latestReading?.timestamp, now]);

  useEffect(() => {
    if (activeConfig) {
      setForm({
        tempMin: activeConfig.tempMin ?? 37.0,
        tempMax: activeConfig.tempMax ?? 39.0,
        humidityMin: activeConfig.humidityMin ?? 55.0,
        humidityMax: activeConfig.humidityMax ?? 65.0,
        turnMode: activeConfig.turnMode ?? 'interval_4x',
        turnIntervalHours: activeConfig.turnIntervalHours ?? 6,
        turnDurationSeconds: activeConfig.turnDurationSeconds ?? 4,
        customStartHour: activeConfig.customStartHour ?? 6,
        buzzerEnabled: activeConfig.buzzerEnabled !== undefined ? activeConfig.buzzerEnabled : true
      });
    }
  }, [activeConfig]);

  const showFeedback = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 4000);
  };

  useEffect(() => {
    // Muat konfigurasi WiFi yang tersimpan di Firebase jika ada
    api.getWifiConfig().then(res => {
      if (res.success && res.data) {
        setWifiForm({
          ssid: res.data.ssid || '',
          password: res.data.password || ''
        });
      }
    }).catch(() => {});
  }, []);

  const handleResetBatch = async (startDayNum = 1) => {
    if (!window.confirm(`Mulai siklus baru dari Hari ke-${startDayNum}? Perhitungan hari akan direset.`)) return;
    setIsResettingBatch(true);
    try {
      await resetBatchTracking(startDayNum);
      showFeedback(`Siklus berhasil direset ke Hari ke-${startDayNum}.`);
    } catch (err) {
      showFeedback('Gagal mereset siklus: ' + err.message, 'error');
    } finally {
      setIsResettingBatch(false);
    }
  };

  const handleSaveWifi = async (e) => {
    e.preventDefault();
    if (!wifiForm.ssid.trim()) {
      showFeedback('Nama WiFi (SSID) tidak boleh kosong.', 'error');
      return;
    }
    setIsSavingWifi(true);
    try {
      await api.updateWifiConfig(wifiForm.ssid.trim(), wifiForm.password);
      showFeedback('Kredensial WiFi dikirim ke Firebase! ESP32 akan menyambung ke jaringan baru.');
    } catch (e) {
      showFeedback('Gagal mengirim konfigurasi WiFi: ' + e.message, 'error');
    } finally {
      setIsSavingWifi(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let intervalHours = 6;
      if (form.turnMode === 'interval_2x') intervalHours = 12; // 06:00, 18:00
      if (form.turnMode === 'interval_3x') intervalHours = 8;  // 06:00, 14:00, 22:00
      if (form.turnMode === 'interval_4x') intervalHours = 6;  // 06:00, 12:00, 18:00, 00:00
      if (form.turnMode === 'custom_hours') intervalHours = parseFloat(form.turnIntervalHours);

      const payload = {
        tempMin: parseFloat(form.tempMin),
        tempMax: parseFloat(form.tempMax),
        humidityMin: parseFloat(form.humidityMin),
        humidityMax: parseFloat(form.humidityMax),
        turnMode: form.turnMode,
        turnIntervalHours: intervalHours,
        turnDurationSeconds: parseFloat(form.turnDurationSeconds),
        customStartHour: parseInt(form.customStartHour, 10),
        buzzerEnabled: form.buzzerEnabled
      };

      const res = await api.updateMainConfig(payload);
      if (res.success) {
        showFeedback('Pengaturan berhasil disimpan ke Inkubator!');
        refreshSettings();
      }
    } catch (e) {
      showFeedback('Gagal menyimpan: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Riwayat Data (Hanya bisa saat hardware online)
  const handleClearHistory = async () => {
    if (!isHardwareOnline) {
      showFeedback('Hardware sedang OFFLINE. Reset data hanya bisa dilakukan saat hardware aktif.', 'error');
      return;
    }
    if (!window.confirm('Yakin ingin menghapus seluruh log riwayat grafik sensor? Tindakan ini berguna saat memulai periode penetasan baru.')) {
      return;
    }

    setIsClearing(true);
    try {
      await api.clearHistory();
      showFeedback('Data riwayat grafik berhasil dibersihkan untuk siklus baru!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      showFeedback('Gagal menghapus riwayat data: ' + e.message, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // Reset Pengaturan Firebase ke Default
  const handleResetFirebase = async () => {
    if (!window.confirm('Kembalikan semua pengaturan Firebase ke default awal (Suhu 37-38°C, Kelembaban 55-65%, Putar 6 Jam / 2 Detik)?')) {
      return;
    }
    setIsResettingFirebase(true);
    try {
      await api.resetFirebaseToDefault();
      showFeedback('Pengaturan Firebase berhasil di-reset ke default!');
      refreshSettings();
    } catch (e) {
      showFeedback('Gagal me-reset Firebase: ' + e.message, 'error');
    } finally {
      setIsResettingFirebase(false);
    }
  };

  // Restart Sistem ESP32 (Hanya bisa saat hardware online)
  const handleRestartDevice = async () => {
    if (!isHardwareOnline) {
      showFeedback('Hardware sedang OFFLINE. Restart sistem hanya bisa dilakukan saat hardware aktif.', 'error');
      return;
    }
    if (!window.confirm('Yakin ingin merestart perangkat ESP32 sekarang? ESP32 akan reboot dan menyambung ulang dalam beberapa detik.')) {
      return;
    }

    setIsRestarting(true);
    try {
      await api.requestRestart();
      showFeedback('Perintah REBOOT dikirim ke ESP32! Perangkat sedang memulai ulang...');
      setTimeout(() => {
        setIsRestarting(false);
      }, 7000);
    } catch (e) {
      showFeedback('Gagal mengirim perintah restart: ' + e.message, 'error');
      setIsRestarting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Toast Feedback */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 ${
          statusMessage.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form Konfigurasi Utama */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">Pengaturan Inkubator</h3>
            <p className="text-xs text-slate-400">Parameter kontrol suhu dan putaran rak telur</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* 1. Suhu */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Batas Suhu Pemanas (°C)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Lampu Nyala (&lt; °C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.tempMin}
                  onChange={(e) => setForm({ ...form, tempMin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Lampu Mati (≥ °C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.tempMax}
                  onChange={(e) => setForm({ ...form, tempMax: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Kelembaban */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Batas Kelembapan Udara (% RH)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Batas Minimal (%)</span>
                <input
                  type="number"
                  step="1"
                  value={form.humidityMin}
                  onChange={(e) => setForm({ ...form, humidityMin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Batas Maksimal (%)</span>
                <input
                  type="number"
                  step="1"
                  value={form.humidityMax}
                  onChange={(e) => setForm({ ...form, humidityMax: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Jadwal Pemutaran Telur & Durasi Geser Motor */}
          <div className="space-y-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Jadwal Putar Telur (WIB)
                </label>
              </div>

              {/* Tombol Uji Motor Diselipkan Kecil & Rapi */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.triggerMotorTurn();
                    showFeedback(`Perintah putar dikirim ke motor (${form.turnDurationSeconds} dtk)!`);
                  } catch (e) {
                    showFeedback('Gagal memicu motor', 'error');
                  }
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer"
                title="Putar motor sekarang untuk uji coba"
              >
                ▶ Tes Putar
              </button>
            </div>

            <select
              value={form.turnMode}
              onChange={(e) => setForm({ ...form, turnMode: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-purple-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="interval_4x">4x Sehari (Tiap 6 Jam: 06:00, 12:00, 18:00, 00:00 WIB)</option>
              <option value="interval_3x">3x Sehari (Tiap 8 Jam: 06:00, 14:00, 22:00 WIB)</option>
              <option value="interval_2x">2x Sehari (Tiap 12 Jam: 06:00 & 18:00 WIB)</option>
              <option value="custom_hours">Kustom Interval (Jam Bebas)</option>
            </select>

            {form.turnMode === 'custom_hours' && (
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1">Putar setiap berapa jam sekali?</span>
                <input
                  type="number"
                  step="0.5"
                  value={form.turnIntervalHours}
                  onChange={(e) => setForm({ ...form, turnIntervalHours: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-purple-400 font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            )}

            {/* Input Tambahan: Durasi Lama Motor Berputar */}
            <div className="pt-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-1">
                <Timer className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Lama Motor Geser (Detik)</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="30"
                  value={form.turnDurationSeconds}
                  onChange={(e) => setForm({ ...form, turnDurationSeconds: e.target.value })}
                  className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  required
                />
                <span className="text-xs text-slate-400">
                  detik sekali jalan (sesuaikan dengan jarak geser rak)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              *ESP32 mencocokkan jam dengan satelit internet (WIB). Jika mati lampu, jadwal jam tidak akan reset ke 00:00.
            </p>
          </div>

          {/* 4. Sakelar Alarm Buzzer */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Buzzer Fisik (Alarm Ekstrem)</span>
                <span className="text-[11px] text-slate-400">Hanya berbunyi jika suhu &gt; 39.5°C atau &lt; 20°C</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, buzzerEnabled: !form.buzzerEnabled })}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                form.buzzerEnabled 
                  ? 'bg-amber-500 text-slate-950' 
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {form.buzzerEnabled ? 'AKTIF' : 'SENYAP'}
            </button>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Kartu Pengaturan WiFi ESP32 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">Hubungkan ke WiFi</h3>
            <p className="text-xs text-slate-400">Ganti SSID dan password WiFi agar ESP32 dapat tersambung</p>
          </div>
        </div>

        <form onSubmit={handleSaveWifi} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama WiFi (SSID)</label>
            <input
              type="text"
              value={wifiForm.ssid}
              onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
              placeholder="Contoh: Redmi 13 / WiFi_Rumah"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password WiFi</label>
            <input
              type="password"
              value={wifiForm.password}
              onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
              placeholder="Masukkan password WiFi"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingWifi}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Wifi className="w-4 h-4" />
            <span>{isSavingWifi ? 'Menyambungkan...' : 'Kirim Kredensial & Hubungkan ESP32'}</span>
          </button>
        </form>
      </div>

      {/* 5. Panel Siklus & Riwayat Hari Penetasan (28 Hari) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Egg className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-base text-white">Siklus Penetasan Telur Bebek</h3>
              <p className="text-xs text-slate-400">Total masa pengeraman: 28 Hari</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Hari berjalan:</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/30">
              Hari ke-{currentDay}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Progres Penetasan</span>
              <span className="text-slate-200 font-semibold">{daysUntilHatch} hari lagi</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((currentDay / 28) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hari 1-24: Fase Setter (putar telur aktif).<br/>
              Hari 25-28: Fase Hatcher (karantina/lockdown, rak diam, kelembaban naik).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-white mb-1">Mulai Siklus Telur Baru</h4>
              <p className="text-xs text-slate-400">
                Reset hitungan hari ke Hari 1 saat memasukkan telur baru ke dalam mesin.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handleResetBatch(1)}
                disabled={isResettingBatch}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResettingBatch ? 'Mereset...' : 'Reset ke Hari 1 (Siklus Baru)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Panel Pemeliharaan & Reset Sistem (HANYA AKTIF SAAT HARDWARE ONLINE) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-semibold text-base text-white">Pemeliharaan & Reset</h3>
              <p className="text-xs text-slate-400">Kontrol perangkat</p>
            </div>
          </div>

          {/* Indikator Online/Offline Status Hardware */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isHardwareOnline 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}>
            {isHardwareOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isHardwareOnline ? 'ONLINE' : 'OFF'}</span>
          </div>
        </div>

        {/* Peringatan jika hardware offline */}
        {!isHardwareOnline && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Perangkat ESP32 sedang offline.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          
          {/* Tombol Reset Riwayat Grafik Data */}
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={!isHardwareOnline || isClearing}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isHardwareOnline 
                ? 'bg-slate-950 border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/10 cursor-pointer' 
                : 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2 text-rose-400 mb-1">
              <Trash2 className="w-4 h-4" />
              <span className="font-semibold text-xs">Reset Riwayat</span>
            </div>
            <p className="text-xs text-slate-400">
              Bersihkan log sensor untuk siklus tetas baru.
            </p>
          </button>

          {/* Tombol Reset Konfigurasi Firebase */}
          <button
            type="button"
            onClick={handleResetFirebase}
            disabled={isResettingFirebase}
            className="p-3 rounded-xl border text-left transition-all flex flex-col justify-between bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/10 cursor-pointer"
          >
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <RotateCcw className="w-4 h-4" />
              <span className="font-semibold text-xs">{isResettingFirebase ? 'Mereset...' : 'Reset Default'}</span>
            </div>
            <p className="text-xs text-slate-400">
              Kembalikan konfigurasi Firebase ke standar pabrik.
            </p>
          </button>

          {/* Tombol Reboot / Restart ESP32 */}
          <button
            type="button"
            onClick={handleRestartDevice}
            disabled={!isHardwareOnline || isRestarting}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isHardwareOnline 
                ? 'bg-slate-950 border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/10 cursor-pointer' 
                : 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <Power className="w-4 h-4" />
              <span className="font-semibold text-xs">{isRestarting ? 'Merestart...' : 'Restart ESP32'}</span>
            </div>
            <p className="text-xs text-slate-400">
              Reboot modul ESP32 secara jarak jauh.
            </p>
          </button>

        </div>
      </div>

    </div>
  );
}
