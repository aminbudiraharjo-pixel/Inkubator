import { ref, get, set, push, update, remove, query, limitToLast, orderByChild } from "firebase/database";
import { rtdb } from "./firebase";

export const api = {
  // Sensor
  async getLatestSensor() {
    // Dengan RTDB, kita biasanya ambil langsung realtime dari IncubatorContext
    // Tapi jika butuh promise sekali panggil:
    const dbRef = ref(rtdb, 'incubator/realtime');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, data: null };
  },

  async getRealtimeWindow(limit = 40) {
    // Ambil data history terakhir untuk grafik
    const historyRef = query(ref(rtdb, 'incubator/history'), orderByChild('timestamp'), limitToLast(limit));
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
      const data = [];
      snapshot.forEach((child) => {
        data.push({ id: child.key, ...child.val() });
      });
      return { success: true, data };
    }
    return { success: true, data: [] };
  },

  async postSensorData(payload) {
    // Endpoint ini nantinya dipanggil oleh ESP32 ke Firebase, jadi frontend tidak butuh fungsi ini lagi
    // tapi disediakan jika simulator masih berjalan di frontend
    const realtimeRef = ref(rtdb, 'incubator/realtime');
    await update(realtimeRef, {
      ...payload,
      last_updated: Date.now()
    });
    
    // Save to history
    const historyRef = ref(rtdb, 'incubator/history');
    await push(historyRef, {
      ...payload,
      timestamp: Date.now(),
      created_at: new Date().toISOString()
    });
    
    return { success: true };
  },

  // History & Data Sensor
  async getHistory(params = {}) {
    const limit = params.limit ? parseInt(params.limit) : 50;
    const historyRef = query(ref(rtdb, 'incubator/history'), limitToLast(limit));
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
      const data = [];
      snapshot.forEach((child) => {
        const val = child.val();
        let created_at = val.created_at;
        if (!created_at && val.timestamp) {
          const rawTs = Number(val.timestamp);
          const adjustedTs = rawTs > 2000000000000 ? rawTs - 25200000 : rawTs;
          created_at = new Date(adjustedTs).toISOString();
        } else if (!created_at) {
          created_at = new Date().toISOString();
        }

        const temp = Number(val.temperature) || 0;
        const hum = Number(val.humidity) || 0;
        let status = 'safe';
        if (temp > 38.5 || temp < 36.0 || hum > 80 || hum < 45) {
          status = 'danger';
        } else if (temp > 38.0 || temp < 37.0 || hum > 70 || hum < 50) {
          status = 'warning';
        }

        data.push({ 
          id: child.key, 
          device_id: val.device_id || 'ESP32_INCUBATOR',
          temperature: temp,
          humidity: hum,
          lamp_on: !!val.lamp_on,
          phase_id: val.phase_id || 'phase_1',
          status,
          created_at,
          ...val 
        });
      });
      data.reverse(); // Urutkan dari data terbaru
      
      return { 
        success: true, 
        data, 
        pagination: { page: 1, limit, total: data.length, totalPages: 1 },
        stats: { totalCount: data.length }
      };
    }
    return { success: true, data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
  },

  // Settings
  async getSettings() {
    const dbRef = ref(rtdb, 'incubator/settings');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, data: null };
  },

  async updateMainConfig(config) {
    const dbRef = ref(rtdb, 'incubator/settings/config');
    await set(dbRef, config);
    return { success: true };
  },

  async triggerMotorTurn() {
    const dbRef = ref(rtdb, 'incubator/control/trigger_turn');
    await set(dbRef, true);
    return { success: true };
  },

  async clearHistory() {
    // Hapus data riwayat sensor untuk reset siklus baru
    const historyRef = ref(rtdb, 'incubator/history');
    await remove(historyRef);
    return { success: true };
  },

  async updateWifiConfig(ssid, password) {
    const dbRef = ref(rtdb, 'incubator/settings/wifi');
    await set(dbRef, {
      ssid,
      password,
      trigger_update: true,
      updated_at: Date.now()
    });
    return { success: true };
  },

  async getWifiConfig() {
    const dbRef = ref(rtdb, 'incubator/settings/wifi');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, data: null };
  },

  async getBatchInfo() {
    const dbRef = ref(rtdb, 'incubator/batch');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: { startDate: Date.now(), totalDays: 28, startDayOffset: 1 } };
  },

  async updateBatchInfo(data) {
    const dbRef = ref(rtdb, 'incubator/batch');
    await update(dbRef, data);
    return { success: true };
  },

  async resetBatch(startDay = 1) {
    // Reset siklus penetasan ke Hari ke-1 (atau hari yang dipilih) mulai saat ini
    const dbRef = ref(rtdb, 'incubator/batch');
    await set(dbRef, {
      startDate: Date.now(),
      totalDays: 28,
      startDayOffset: parseInt(startDay, 10) || 1,
      lastReset: Date.now()
    });
    return { success: true };
  },

  async resetFirebaseToDefault() {
    // Reset seluruh pengaturan Firebase ke standar awal inkubator bebek
    const defaultConfig = {
      tempMin: 37.0,
      tempMax: 39.0, // Default 37 - 39 °C
      humidityMin: 55.0,
      humidityMax: 65.0, // Default 55 - 65 %
      turnMode: 'interval_4x',
      turnIntervalHours: 6,
      turnDurationSeconds: 4, // Default 4 detik
      customStartHour: 6,
      buzzerEnabled: true
    };
    await set(ref(rtdb, 'incubator/settings/config'), defaultConfig);
    await set(ref(rtdb, 'incubator/control'), {
      trigger_turn: false,
      trigger_restart: false
    });
    await remove(ref(rtdb, 'incubator/alerts'));
    return { success: true };
  },

  async requestRestart() {
    // Kirim sinyal restart perangkat ke ESP32
    const restartRef = ref(rtdb, 'incubator/control/trigger_restart');
    await set(restartRef, true);
    return { success: true };
  },

  async updateActivePhase(phaseId) {
    const dbRef = ref(rtdb, 'incubator/settings');
    await update(dbRef, { active_phase: phaseId });
    return { success: true };
  },

  async updatePhaseConfig(phaseId, config) {
    const dbRef = ref(rtdb, `incubator/settings/phase_config_${phaseId}`);
    await set(dbRef, config);
    return { success: true };
  },

  async updateNotifications(data) {
    const dbRef = ref(rtdb, 'incubator/settings/notifications');
    await update(dbRef, data);
    return { success: true };
  },

  // Alerts
  async getAlerts(limit = 50) {
    const alertsRef = query(ref(rtdb, 'incubator/alerts'), limitToLast(limit));
    const snapshot = await get(alertsRef);
    if (snapshot.exists()) {
      const data = [];
      let unreadCount = 0;
      snapshot.forEach((child) => {
        const alert = { id: child.key, ...child.val() };
        if (!alert.is_read) unreadCount++;
        data.push(alert);
      });
      data.reverse();
      return { success: true, data, unreadCount };
    }
    return { success: true, data: [], unreadCount: 0 };
  },

  async markAlertsRead(alertId = null) {
    if (alertId) {
      await update(ref(rtdb, `incubator/alerts/${alertId}`), { is_read: 1 });
    } else {
      // Mark all read
      const alertsRef = ref(rtdb, 'incubator/alerts');
      const snapshot = await get(alertsRef);
      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((child) => {
          updates[`${child.key}/is_read`] = 1;
        });
        await update(alertsRef, updates);
      }
    }
    return { success: true };
  },

  async clearAlerts() {
    await remove(ref(rtdb, 'incubator/alerts'));
    return { success: true };
  },

  // Simulator
  async getSimulatorStatus() {
    const dbRef = ref(rtdb, 'incubator/simulator');
    const snapshot = await get(dbRef);
    return { success: true, data: snapshot.exists() ? snapshot.val() : { isRunning: false, currentMode: 'normal' } };
  },

  async toggleSimulator(enable, intervalMs) {
    const dbRef = ref(rtdb, 'incubator/simulator');
    await update(dbRef, { isRunning: enable, intervalMs });
    return { success: true, data: { isRunning: enable } };
  },

  async setSimulatorMode(mode) {
    const dbRef = ref(rtdb, 'incubator/simulator');
    await update(dbRef, { currentMode: mode });
    return { success: true, data: { currentMode: mode } };
  }
};
