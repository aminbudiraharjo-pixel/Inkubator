import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryTable() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: statusFilter,
        phase_id: phaseFilter
      };
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const res = await api.getHistory(params);
      if (res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        setStats(res.stats || null);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, statusFilter, phaseFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleExportCsv = () => {
    if (!logs || logs.length === 0) {
      alert('Belum ada data sensor untuk diekspor!');
      return;
    }

    // Siapkan Header CSV
    const headers = ['Waktu', 'Device ID', 'Suhu (C)', 'Kelembaban (%RH)', 'Status Lampu', 'Status Lingkungan', 'Fase'];
    
    // Siapkan Baris Data CSV
    const rows = logs.map(row => {
      const timeStr = row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-';
      const lampStr = row.lamp_on ? 'ON (Menyala)' : 'OFF (Padam)';
      const statusStr = row.status === 'safe' ? 'Aman' : row.status === 'warning' ? 'Peringatan' : 'Bahaya';
      const phaseStr = row.phase_id === 'phase_1' ? 'Fase 1' : row.phase_id === 'phase_2' ? 'Fase 2 (Hatching)' : (row.phase_id || 'Fase 1');

      return [
        `"${timeStr}"`,
        `"${row.device_id || 'ESP32_INCUBATOR'}"`,
        Number(row.temperature).toFixed(1),
        Number(row.humidity).toFixed(1),
        `"${lampStr}"`,
        `"${statusStr}"`,
        `"${phaseStr}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const nowStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `log_sensor_inkubator_${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    if (status === 'safe') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>Aman</span>
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          <span>Peringatan</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertOctagon className="w-3 h-3" />
        <span>Kritis</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* 1. AGGREGATE SUMMARY METRICS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium">Total Rekaman</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.totalCount}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-amber-400 font-medium">Suhu Terendah</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.minTemp ?? '-'} °C</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-amber-400 font-medium">Suhu Rata-rata</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.avgTemp ?? '-'} °C</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-amber-400 font-medium">Suhu Tertinggi</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.maxTemp ?? '-'} °C</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-cyan-400 font-medium">RH Terendah</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.minHum ?? '-'} %</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-cyan-400 font-medium">RH Tertinggi</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.maxHum ?? '-'} %</div>
          </div>
        </div>
      )}

      {/* 2. FILTER & EXPORT ACTIONS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Start Date */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Dari:</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sampai:</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Semua Status</option>
                <option value="safe" className="bg-slate-900">Aman (Hijau)</option>
                <option value="warning" className="bg-slate-900">Peringatan (Kuning)</option>
                <option value="danger" className="bg-slate-900">Kritis (Merah)</option>
              </select>
            </div>

            {/* Phase Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Semua Fase</option>
                <option value="phase_1" className="bg-slate-900">Fase 1 (Hari 1-24)</option>
                <option value="phase_2" className="bg-slate-900">Fase 2 (Hari 25-28)</option>
                <option value="custom" className="bg-slate-900">Kustom</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs(1)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>

        </div>

        {/* 3. LOGS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu (WIB / Lokal)</th>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Suhu (°C)</th>
                <th className="py-3 px-4">Kelembaban (%RH)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Memuat data riwayat sensor...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-sans">
                    Tidak ada data log yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(row.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{row.device_id}</td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {Number(row.temperature).toFixed(1)} °C
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {Number(row.humidity).toFixed(1)} %
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
                    <td className="py-3 px-4 text-slate-400 capitalize">
                      {row.phase_id === 'phase_1' ? 'Fase 1' : row.phase_id === 'phase_2' ? 'Fase 2 (Hatching)' : row.phase_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION CONTROLS */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-sans">
          <div>
            Menampilkan halaman <strong className="text-white">{pagination.page}</strong> dari <strong className="text-white">{pagination.totalPages || 1}</strong> (Total {pagination.total} rekaman)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
