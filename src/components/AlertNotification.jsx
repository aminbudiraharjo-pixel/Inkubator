import React from 'react';
import { 
  Bell, 
  X, 
  Trash2, 
  CheckCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Thermometer, 
  Droplets,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';

export default function AlertNotification({ isOpen, onClose }) {
  const { 
    alerts, 
    unreadAlertCount, 
    markAllAlertsAsRead, 
    clearAllAlerts, 
    soundEnabled, 
    setSoundEnabled 
  } = useIncubator();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Pusat Notifikasi & Riwayat Alert
              </h3>
              <p className="text-xs text-slate-400">
                {unreadAlertCount > 0 ? `${unreadAlertCount} peringatan belum dibaca` : 'Semua peringatan telah ditinjau'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                soundEnabled 
                  ? 'bg-slate-800 border-slate-700 text-emerald-400' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Alarm Audio Aktif' : 'Alarm Audio Dimatikan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <button
            onClick={markAllAlertsAsRead}
            disabled={unreadAlertCount === 0}
            className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-emerald-400 font-semibold"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tandai Semua Dibaca</span>
          </button>

          <button
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-40 disabled:hover:text-rose-400 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Riwayat Alert</span>
          </button>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              Tidak ada catatan peringatan anomali. Inkubator berjalan normal!
            </div>
          ) : (
            alerts.map((alert, idx) => {
              const isDanger = alert.level === 'danger';
              const isTemp = alert.type === 'temperature';
              const Icon = isDanger ? AlertOctagon : AlertTriangle;

              return (
                <div
                  key={alert.id || idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    alert.is_read
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                      : isDanger
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${
                        isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {isDanger ? 'Bahaya Kritis' : 'Peringatan'}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 capitalize">
                            {isTemp ? 'Anomali Suhu' : 'Anomali Kelembaban'}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-200 leading-relaxed font-medium">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap text-[10px] text-slate-500 font-mono">
                      {new Date(alert.created_at || Date.now()).toLocaleTimeString('id-ID')}
                    </div>
                  </div>

                  {/* Detail Ambang Batas */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      {isTemp ? <Thermometer className="w-3.5 h-3.5 text-amber-400" /> : <Droplets className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>Nilai: <strong className="text-white">{alert.value} {isTemp ? '°C' : '%'}</strong></span>
                    </span>
                    <span>
                      Target: {alert.threshold_min} - {alert.threshold_max} {isTemp ? '°C' : '%'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
