import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { api } from '../services/api';

const IncubatorContext = createContext(null);

export const IncubatorProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestReading, setLatestReading] = useState(null);
  const [realtimeHistory, setRealtimeHistory] = useState([]);
  const [activePhase, setActivePhase] = useState('phase_1');
  const [activeConfig, setActiveConfig] = useState({
    tempMin: 37.0,
    tempMax: 39.0,
    tempWarnLow: 36.5,
    tempWarnHigh: 39.5,
    humidityMin: 55.0,
    humidityMax: 65.0,
    humidityWarnLow: 50.0,
    humidityWarnHigh: 70.0,
    turnDurationSeconds: 4,
    name: 'Inkubator Bebek'
  });
  const [allPhaseConfigs, setAllPhaseConfigs] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [simulatorState, setSimulatorState] = useState({
    isRunning: false,
    currentMode: 'normal'
  });
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [batchInfo, setBatchInfo] = useState({
    startDate: Date.now(),
    totalDays: 28,
    startDayOffset: 1
  });
  const lastBuzzerPlayRef = useRef(0);

  // Perhitungan Hari Penetasan Berjalan (28 Hari untuk Bebek)
  const currentDay = React.useMemo(() => {
    if (!batchInfo?.startDate) return 1;
    const diffMs = Date.now() - Number(batchInfo.startDate);
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const offset = Number(batchInfo.startDayOffset) || 1;
    return Math.min(28, Math.max(1, offset + diffDays));
  }, [batchInfo]);

  const daysUntilHatch = Math.max(0, 28 - currentDay);

  // Audio synthesizer buzzer inkubator (frekuensi piezoelektrik ~2.4kHz, pola multi-beep)
  const triggerBuzzerSound = useCallback((pattern = 'danger') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const beepCount = pattern === 'danger' ? 5 : 3;
      const freq = pattern === 'danger' ? 2400 : 1800; // Frekuensi khas piezo buzzer
      const beepDuration = 0.12; // 120 ms
      const interval = 0.22;     // 220 ms antar beep

      for (let i = 0; i < beepCount; i++) {
        const startTime = ctx.currentTime + (i * interval);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square'; // Gelombang kotak mirip suara buzzer hardware
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gain.gain.setValueAtTime(0.2, startTime + beepDuration - 0.02);
        gain.gain.linearRampToValueAtTime(0.0001, startTime + beepDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + beepDuration);
      }
    } catch (e) {
      console.warn('Audio Context tidak didukung atau terblokir autoplay browser:', e);
    }
  }, [soundEnabled]);

  const playBeep = useCallback((level = 'warning') => {
    triggerBuzzerSound(level === 'danger' ? 'danger' : 'warning');
  }, [triggerBuzzerSound]);

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    try {
      // Alerts initial load
      const alertsRes = await api.getAlerts(30);
      if (alertsRes.success) {
        setAlerts(alertsRes.data || []);
        setUnreadAlertCount(alertsRes.unreadCount || 0);
      }
      
      // History for chart
      const windowRes = await api.getRealtimeWindow(40);
      if (windowRes.success && windowRes.data) {
        setRealtimeHistory(windowRes.data);
      }
    } catch (err) {
      console.error('Error saat load data inisial:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Firebase Listeners
    const realtimeRef = ref(rtdb, 'incubator/realtime');
    const settingsRef = ref(rtdb, 'incubator/settings');
    const alertsRef = ref(rtdb, 'incubator/alerts');
    const simulatorRef = ref(rtdb, 'incubator/simulator');
    const batchRef = ref(rtdb, 'incubator/batch');

    // 1. Listen to Realtime Sensor Data
    const unsubscribeRealtime = onValue(realtimeRef, (snapshot) => {
      setIsConnected(true); // asalkan firebase bisa connect
      setLastHeartbeat(new Date());
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLatestReading(data);

        // Simulasi Alarm Buzzer Web hanya jika Terjadi Kondisi Bahaya Fatal (Overheat Kritis >= 39.8 C atau Air Kering < 40%)
        const temp = data?.temperature !== undefined ? Number(data.temperature) : null;
        const hum = data?.humidity !== undefined ? Number(data.humidity) : null;
        const isExtreme = (temp !== null && temp >= 39.8) ||
                          (hum !== null && (hum < 40.0 || hum > 90.0));

        if (isExtreme) {
          const nowMs = Date.now();
          // Jeda hening 25 detik agar bunyi 5x beep tidak berulang spam setiap detik
          if (nowMs - lastBuzzerPlayRef.current >= 25000) {
            lastBuzzerPlayRef.current = nowMs;
            triggerBuzzerSound('danger');
          }
        }
        
        setRealtimeHistory(prev => {
          // Hanya tambahkan jika timestamp baru untuk menghindari duplikat di array
          const lastItem = prev.length > 0 ? prev[prev.length - 1] : null;
          if (!lastItem || lastItem.timestamp !== data.timestamp) {
            const updated = [...prev, data];
            return updated.slice(-50); // Simpan 50 data point
          }
          return prev;
        });
      }
    });

    // 2. Listen to Settings changes
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const s = snapshot.val();
        if (s.config) {
          setActiveConfig(s.config);
        } else {
          setActiveConfig(s.phase_config_custom || s.phase_config_phase_1);
        }
      }
    });

    // 3. Listen to Simulator status
    const unsubscribeSimulator = onValue(simulatorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSimulatorState(snapshot.val());
      }
    });

    // 4. Listen to Batch / Riwayat Hari Pengeraman
    const unsubscribeBatch = onValue(batchRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setBatchInfo(val);
      }
    });
    
    // Cleanup listeners on unmount
    return () => {
      off(realtimeRef, 'value', unsubscribeRealtime);
      off(settingsRef, 'value', unsubscribeSettings);
      off(simulatorRef, 'value', unsubscribeSimulator);
      off(batchRef, 'value', unsubscribeBatch);
    };
  }, [loadInitialData, triggerBuzzerSound]);

  // Actions
  const switchPhase = async (phaseId) => {
    try {
      await api.updateActivePhase(phaseId);
      setActivePhase(phaseId);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAlertsAsRead = async () => {
    try {
      await api.markAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
      setUnreadAlertCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllAlerts = async () => {
    try {
      await api.clearAlerts();
      setAlerts([]);
      setUnreadAlertCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSimulator = async (enable, intervalMs) => {
    try {
      await api.toggleSimulator(enable, intervalMs);
    } catch (e) {
      console.error(e);
    }
  };

  const setSimulatorScenario = async (mode) => {
    try {
      await api.setSimulatorMode(mode);
    } catch (e) {
      console.error(e);
    }
  };

  const resetBatchTracking = async (startDay = 1) => {
    try {
      await api.resetBatch(startDay);
    } catch (e) {
      console.error('Error reset batch:', e);
      throw e;
    }
  };

  return (
    <IncubatorContext.Provider
      value={{
        isConnected,
        latestReading,
        realtimeHistory,
        activePhase,
        activeConfig,
        allPhaseConfigs,
        alerts,
        unreadAlertCount,
        soundEnabled,
        setSoundEnabled,
        triggerBuzzerSound,
        playBeep,
        simulatorState,
        lastHeartbeat,
        batchInfo,
        currentDay,
        daysUntilHatch,
        resetBatchTracking,
        switchPhase,
        markAllAlertsAsRead,
        clearAllAlerts,
        toggleSimulator,
        setSimulatorScenario,
        refreshSettings: loadInitialData
      }}
    >
      {children}
    </IncubatorContext.Provider>
  );
};

export const useIncubator = () => {
  const context = useContext(IncubatorContext);
  if (!context) {
    throw new Error('useIncubator must be used within an IncubatorProvider');
  }
  return context;
};
