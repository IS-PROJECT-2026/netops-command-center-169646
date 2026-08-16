/**
 * LocalStorage Persistence Engine for NetOps Command Center
 * Wraps localStorage operations to save/load devices, incidents, and diagnostic history across page reloads.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    DEVICES: 'netops_devices',
    INCIDENTS: 'netops_incidents',
    HISTORY: 'netops_history'
  };

  /**
   * Safe JSON parse wrapper
   */
  function safeJSONParse(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (err) {
      console.warn(`[NetOpsStorage] Failed to parse localStorage key "${key}":`, err);
      return defaultValue;
    }
  }

  /**
   * Safe JSON stringify and set item wrapper
   */
  function safeJSONSave(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[NetOpsStorage] Failed to save key "${key}" to localStorage:`, err);
      return false;
    }
  }

  /**
   * Normalize an incident object to guarantee all expected fields are present
   */
  function normalizeIncident(inc) {
    if (!inc) return null;
    const devices = inc.affectedDevices || inc.affected_devices || ["core-router-01.dc1"];
    const devicesArr = Array.isArray(devices) ? devices : [devices];
    const timeStr = inc.startTime || inc.timestamp || "2026-08-16 20:00:00";

    return {
      id: inc.id || `INC-${Math.floor(9000 + Math.random() * 1000)}`,
      title: inc.title || "Network Incident",
      severity: inc.severity || "Medium",
      status: inc.status || "Detected",
      affectedDevices: devicesArr,
      affected_devices: devicesArr,
      startTime: timeStr,
      timestamp: timeStr,
      description: inc.description || "Active incident registered in NOC telemetry logs."
    };
  }

  /**
   * Storage Wrapper API
   */
  const NetOpsStorage = {
    saveDevices(devices) {
      if (!Array.isArray(devices)) return false;
      return safeJSONSave(STORAGE_KEYS.DEVICES, devices);
    },

    loadDevices() {
      return safeJSONParse(STORAGE_KEYS.DEVICES, null);
    },

    saveIncidents(incidents) {
      if (!Array.isArray(incidents)) return false;
      const normalized = incidents.map(normalizeIncident).filter(Boolean);
      return safeJSONSave(STORAGE_KEYS.INCIDENTS, normalized);
    },

    loadIncidents() {
      const loaded = safeJSONParse(STORAGE_KEYS.INCIDENTS, null);
      if (Array.isArray(loaded)) {
        return loaded.map(normalizeIncident).filter(Boolean);
      }
      return null;
    },

    saveHistory(history) {
      if (!Array.isArray(history)) return false;
      return safeJSONSave(STORAGE_KEYS.HISTORY, history);
    },

    loadHistory() {
      return safeJSONParse(STORAGE_KEYS.HISTORY, []);
    },

    addHistoryEntry(entry) {
      const history = this.loadHistory();
      history.unshift(entry);
      // Limit saved history logs to last 50 entries
      if (history.length > 50) {
        history.length = 50;
      }
      return this.saveHistory(history);
    },

    /**
     * Save all current application state to localStorage
     */
    saveAllState() {
      if (window.NetOpsState && window.NetOpsState.data) {
        if (window.NetOpsState.data.devices) {
          this.saveDevices(window.NetOpsState.data.devices);
        }
      }

      if (window.NetOpsIncidents && Array.isArray(window.NetOpsIncidents.data)) {
        this.saveIncidents(window.NetOpsIncidents.data);
      } else if (window.NetOpsState && window.NetOpsState.data && window.NetOpsState.data.incidents) {
        this.saveIncidents(window.NetOpsState.data.incidents);
      }
    },

    /**
     * Initialize saved state on page load
     */
    initStorage() {
      // 1. Devices Restoration
      const savedDevices = this.loadDevices();
      if (savedDevices && Array.isArray(savedDevices) && savedDevices.length > 0) {
        if (window.NetOpsState && window.NetOpsState.data) {
          window.NetOpsState.data.devices = savedDevices;
        }
      } else if (window.NetOpsState && window.NetOpsState.data && window.NetOpsState.data.devices) {
        this.saveDevices(window.NetOpsState.data.devices);
      }

      // 2. Incidents Restoration
      const savedIncidents = this.loadIncidents();
      if (savedIncidents && Array.isArray(savedIncidents) && savedIncidents.length > 0) {
        if (window.NetOpsState && window.NetOpsState.data) {
          window.NetOpsState.data.incidents = savedIncidents;
        }
        if (window.NetOpsIncidents && Array.isArray(window.NetOpsIncidents.data)) {
          window.NetOpsIncidents.data.length = 0;
          window.NetOpsIncidents.data.push(...savedIncidents);
        }
      } else {
        const initialInc = (window.NetOpsIncidents && window.NetOpsIncidents.data) ||
                           (window.NetOpsState && window.NetOpsState.data && window.NetOpsState.data.incidents);
        if (initialInc) {
          this.saveIncidents(initialInc);
        }
      }

      // 3. Setup hooks to auto-save whenever state changes
      this.attachSaveHooks();
    },

    /**
     * Attach persistence hooks to state modification functions
     */
    attachSaveHooks() {
      if (window.NetOpsIncidents) {
        const origAdd = window.NetOpsIncidents.addIncident;
        const origUpdate = window.NetOpsIncidents.updateStatus;
        const origAdvance = window.NetOpsIncidents.advanceLifecycle;

        if (origAdd && !origAdd._isHooked) {
          window.NetOpsIncidents.addIncident = function (...args) {
            const res = origAdd.apply(this, args);
            NetOpsStorage.saveIncidents(window.NetOpsIncidents.data);
            return res;
          };
          window.NetOpsIncidents.addIncident._isHooked = true;
        }

        if (origUpdate && !origUpdate._isHooked) {
          window.NetOpsIncidents.updateStatus = function (...args) {
            const res = origUpdate.apply(this, args);
            NetOpsStorage.saveIncidents(window.NetOpsIncidents.data);
            return res;
          };
          window.NetOpsIncidents.updateStatus._isHooked = true;
        }

        if (origAdvance && !origAdvance._isHooked) {
          window.NetOpsIncidents.advanceLifecycle = function (...args) {
            const res = origAdvance.apply(this, args);
            NetOpsStorage.saveIncidents(window.NetOpsIncidents.data);
            return res;
          };
          window.NetOpsIncidents.advanceLifecycle._isHooked = true;
        }
      }

      if (window.runDiagnostic && !window.runDiagnostic._isHooked) {
        const origRunDiag = window.runDiagnostic;
        window.runDiagnostic = async function (...args) {
          const res = await origRunDiag.apply(this, args);
          if (res) {
            NetOpsStorage.addHistoryEntry(res);
          }
          return res;
        };
        window.runDiagnostic._isHooked = true;
      }
    }
  };

  // Run initial state loading immediately or on DOM ready
  if (window.NetOpsState) {
    NetOpsStorage.initStorage();
  }

  document.addEventListener('DOMContentLoaded', () => {
    NetOpsStorage.initStorage();

    // Populate history table from saved history if table exists
    const savedHistory = NetOpsStorage.loadHistory();
    const tbody = document.getElementById('diag-history-tbody');
    if (tbody && savedHistory.length > 0 && tbody.children.length === 0) {
      tbody.innerHTML = savedHistory.slice(0, 10).map(result => {
        const timePart = (result.timestamp || '').includes(' ') ? result.timestamp.split(' ')[1] : result.timestamp;
        return `
          <tr class="${result.success ? 'row-success' : 'row-failure'}">
            <td><code class="code-tag">${timePart || 'N/A'}</code></td>
            <td><strong>${result.toolName || 'Tool'}</strong></td>
            <td><code>${result.targetDevice || 'Target'}</code></td>
            <td><span class="status-badge ${result.success ? 'status-badge-resolved' : 'status-badge-detected'}">${result.status}</span></td>
            <td>${result.latency}</td>
            <td>${result.packetLoss}</td>
          </tr>
        `;
      }).join('');
    }
  });

  window.addEventListener('beforeunload', () => {
    NetOpsStorage.saveAllState();
  });

  window.NetOpsStorage = NetOpsStorage;
})();
