import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  Clock, 
  Thermometer, 
  Droplets, 
  RefreshCw, 
  Maximize2,
  Calendar
} from 'lucide-react';
import { useIncubator } from '../context/IncubatorContext';
import { api } from '../services/api';

export default function RealtimeCharts() {
  const { realtimeHistory, activeConfig } = useIncubator();
  const [timeRange, setTimeRange] = useState('live'); // 'live', '1h', '24h'
  const [chartData, setChartData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('both'); // 'both', 'temp', 'hum'

  const tempMin = activeConfig?.tempMin ?? 37.5;
  const tempMax = activeConfig?.tempMax ?? 38.0;
  const humMin = activeConfig?.humidityMin ?? 55.0;
  const humMax = activeConfig?.humidityMax ?? 65.0;

  // Format data untuk grafik
  useEffect(() => {
    if (timeRange === 'live') {
      const formatted = realtimeHistory.map((item, idx) => {
        const timeStr = item.created_at 
          ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : `T-${realtimeHistory.length - idx}`;

        return {
          ...item,
          displayTime: timeStr,
          temperature: typeof item.temperature === 'number' ? item.temperature : parseFloat(item.temperature),
          humidity: typeof item.humidity === 'number' ? item.humidity : parseFloat(item.humidity),
        };
      });
      setChartData(formatted);
    } else {
      fetchHistoricalData(timeRange);
    }
  }, [timeRange, realtimeHistory]);

  const fetchHistoricalData = async (range) => {
    setIsLoadingHistory(true);
    try {
      const now = new Date();
      let startDate = new Date();

      if (range === '1h') {
        startDate.setHours(now.getHours() - 1);
      } else if (range === '24h') {
        startDate.setHours(now.getHours() - 24);
      }

      const res = await api.getHistory({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        limit: 100
      });

      if (res.success && res.data) {
        // Balikkan urutan agar kronologis (lama ke baru)
        const sorted = [...res.data].reverse().map(item => ({
          ...item,
          displayTime: new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          temperature: parseFloat(item.temperature),
          humidity: parseFloat(item.humidity)
        }));
        setChartData(sorted);
      }
    } catch (e) {
      console.error('Error fetching historical chart data:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Custom Tooltip Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[200px]">
          <div className="text-slate-400 text-[11px] pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Waktu:</span>
            <span className="font-semibold text-slate-200">{label}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5" /> Suhu:
              </span>
              <span className="font-bold text-sm text-white">{data.temperature?.toFixed(2)} °C</span>
            </div>

            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" /> Kelembaban:
              </span>
              <span className="font-bold text-sm text-white">{data.humidity?.toFixed(1)} %</span>
            </div>

            <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                data.status === 'safe' ? 'bg-emerald-500/20 text-emerald-400' :
                data.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {data.status || 'safe'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Stats calculation over current data
  const temps = chartData.map(d => d.temperature).filter(v => !isNaN(v));
  const hums = chartData.map(d => d.humidity).filter(v => !isNaN(v));

  const minTemp = temps.length ? Math.min(...temps).toFixed(1) : '-';
  const maxTemp = temps.length ? Math.max(...temps).toFixed(1) : '-';
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '-';

  const minHum = hums.length ? Math.min(...hums).toFixed(1) : '-';
  const maxHum = hums.length ? Math.max(...hums).toFixed(1) : '-';
  const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '-';

  return (
    <div className="space-y-4">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-100">
              Grafik Sensor
            </h3>
            <p className="text-xs text-slate-400">
              Pemantauan suhu & kelembaban realtime
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Metric Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedMetric('both')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedMetric === 'both' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedMetric('temp')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedMetric === 'temp' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Suhu
            </button>
            <button
              onClick={() => setSelectedMetric('hum')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedMetric === 'hum' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kelembaban
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setTimeRange('live')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                timeRange === 'live' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>Live (Realtime)</span>
            </button>
            <button
              onClick={() => setTimeRange('1h')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                timeRange === '1h' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Jam
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                timeRange === '24h' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24 Jam
            </button>
          </div>

        </div>
      </div>

      {/* Mini Quick Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-amber-400 font-medium">Suhu Rata-rata</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{avgTemp} °C</div>
          <div className="text-[10px] text-slate-500 font-mono">Min: {minTemp}°C | Max: {maxTemp}°C</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-cyan-400 font-medium">Kelembaban Rata-rata</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{avgHum} %</div>
          <div className="text-[10px] text-slate-500 font-mono">Min: {minHum}% | Max: {maxHum}%</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-emerald-400 font-medium">Rentang Ideal Suhu</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{tempMin} - {tempMax} °C</div>
          <div className="text-[10px] text-slate-500">Target Penetasan</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-emerald-400 font-medium">Rentang Ideal RH</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{humMin} - {humMax} %</div>
          <div className="text-[10px] text-slate-500">Target Kelembaban</div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative min-h-[380px]">
        {isLoadingHistory && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memuat data riwayat...</span>
            </div>
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 space-y-2">
            <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-sm">Menunggu aliran data sensor masuk...</p>
            <p className="text-xs text-slate-500">Pastikan ESP32 dalam keadaan hidup dan terhubung ke WiFi</p>
          </div>
        ) : (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                
                <XAxis 
                  dataKey="displayTime" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                
                {/* Left Y Axis for Temperature */}
                {(selectedMetric === 'both' || selectedMetric === 'temp') && (
                  <YAxis 
                    yAxisId="left"
                    domain={[35.0, 40.5]}
                    stroke="#f59e0b"
                    fontSize={11}
                    tickFormatter={(val) => `${val}°C`}
                  />
                )}

                {/* Right Y Axis for Humidity */}
                {(selectedMetric === 'both' || selectedMetric === 'hum') && (
                  <YAxis 
                    yAxisId="right"
                    orientation={selectedMetric === 'hum' ? 'left' : 'right'}
                    domain={[30, 95]}
                    stroke="#06b6d4"
                    fontSize={11}
                    tickFormatter={(val) => `${val}%`}
                  />
                )}

                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />

                {/* Reference Lines for Ideal Temp Limits */}
                {(selectedMetric === 'both' || selectedMetric === 'temp') && (
                  <>
                    <ReferenceLine 
                      yAxisId="left" 
                      y={tempMin} 
                      stroke="#22c55e" 
                      strokeDasharray="4 4" 
                      label={{ value: `Min Temp (${tempMin}°C)`, fill: '#22c55e', fontSize: 10, position: 'insideTopLeft' }} 
                    />
                    <ReferenceLine 
                      yAxisId="left" 
                      y={tempMax} 
                      stroke="#22c55e" 
                      strokeDasharray="4 4" 
                      label={{ value: `Max Temp (${tempMax}°C)`, fill: '#22c55e', fontSize: 10, position: 'insideBottomLeft' }} 
                    />
                  </>
                )}

                {/* Lines */}
                {(selectedMetric === 'both' || selectedMetric === 'temp') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    name="Suhu (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                )}

                {(selectedMetric === 'both' || selectedMetric === 'hum') && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="humidity"
                    name="Kelembaban (%RH)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

    </div>
  );
}
