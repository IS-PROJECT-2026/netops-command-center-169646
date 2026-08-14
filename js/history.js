/**
 * Investigation History Core Module
 * NetOps Command Center
 */

(function () {
  'use strict';

  // Initial Historical Resolved Incidents
  const initialInvestigationHistory = [
    {
      id: "INC-8902",
      title: "Primary Power Supply Degradation on Edge FW",
      severity: "Medium",
      status: "Resolved",
      affectedDevices: ["fw-cluster-main.dc1"],
      startTime: "2026-08-11 11:20:00",
      resolvedAt: "2026-08-11 12:45:00",
      rootCause: "PSU-1 input voltage anomaly cleared after ATS automatic failover to secondary utility feed.",
      confidenceScore: 95
    },
    {
      id: "INC-8890",
      title: "DNS Anycast Node Resolution Delays",
      severity: "High",
      status: "Resolved",
      affectedDevices: ["dns-auth-01.global"],
      startTime: "2026-08-09 14:10:00",
      resolvedAt: "2026-08-09 15:30:00",
      rootCause: "UDP port 53 socket queue exhaustion caused by misconfigured rate-limiter on upstream transit router.",
      confidenceScore: 88
    },
    {
      id: "INC-8875",
      title: "US-West Distribution Switch Packet Drop Burst",
      severity: "Low",
      status: "Resolved",
      affectedDevices: ["access-sw-44.us2"],
      startTime: "2026-08-07 09:15:00",
      resolvedAt: "2026-08-07 10:05:00",
      rootCause: "Faulty patch cable SFP transceiver swapped out on interface Eth1/24.",
      confidenceScore: 92
    }
  ];

  // Initialize history state in NetOpsState
  function initHistoryState() {
    if (window.NetOpsState && window.NetOpsState.data) {
      if (!window.NetOpsState.data.investigationHistory) {
        window.NetOpsState.data.investigationHistory = [...initialInvestigationHistory];
      }
      window.NetOpsState.getInvestigationHistory = function () {
        return window.NetOpsState.data.investigationHistory;
      };
    }
  }

  /**
   * Push a resolved incident into the Investigation History array
   * @param {Object} incident - Incident object being resolved
   * @returns {Object} Added historical incident record
   */
  function pushResolvedIncident(incident) {
    initHistoryState();

    if (!incident) return null;

    const now = new Date();
    const resolvedTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    // Calculate score using RCA engine if available
    let score = incident.confidenceScore || 90;
    if (window.NetOpsRCA && typeof window.NetOpsRCA.calculateScore === 'function') {
      score = window.NetOpsRCA.calculateScore().score;
    }

    const historyRecord = {
      id: incident.id || `INC-${Math.floor(8000 + Math.random() * 1000)}`,
      title: incident.title || "Resolved Incident",
      severity: incident.severity || "Medium",
      status: "Resolved",
      affectedDevices: incident.affected_devices || incident.affectedDevices || ["core-router-01.dc1"],
      startTime: incident.timestamp || incident.startTime || resolvedTimeStr,
      resolvedAt: resolvedTimeStr,
      rootCause: incident.description || incident.rootCause || "Incident root cause verified and telemetry restored.",
      confidenceScore: score
    };

    const historyArray = window.NetOpsState ? window.NetOpsState.data.investigationHistory : initialInvestigationHistory;
    
    // Prevent duplicate entries
    const existingIdx = historyArray.findIndex(item => item.id === historyRecord.id);
    if (existingIdx >= 0) {
      historyArray[existingIdx] = historyRecord;
    } else {
      historyArray.unshift(historyRecord);
    }

    renderInvestigationHistoryUI();
    return historyRecord;
  }

  /**
   * Render clean HTML list of historical incidents
   */
  function renderInvestigationHistoryUI() {
    initHistoryState();
    const container = document.getElementById('investigation-history-list');
    if (!container) return;

    const historyData = (window.NetOpsState && window.NetOpsState.data.investigationHistory) || initialInvestigationHistory;

    if (historyData.length === 0) {
      container.innerHTML = `
        <div class="empty-history-state">
          <p>No historical resolved investigations recorded yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = historyData.map(item => {
      const severityLower = (item.severity || 'medium').toLowerCase();
      const devices = Array.isArray(item.affectedDevices) ? item.affectedDevices.join(', ') : item.affectedDevices;

      return `
        <li class="history-item-card">
          <div class="history-item-header">
            <div class="history-title-group">
              <span class="history-id-badge">${item.id}</span>
              <h4 class="history-item-title">${item.title}</h4>
            </div>
            <div class="history-badges">
              <span class="severity-badge badge-${severityLower}">${item.severity.toUpperCase()}</span>
              <span class="status-badge status-healthy">✓ RESOLVED</span>
              <span class="rca-score-badge">${item.confidenceScore}% RCA Score</span>
            </div>
          </div>

          <div class="history-item-body">
            <p class="history-cause-text"><strong>Resolution & RCA:</strong> ${item.rootCause}</p>
          </div>

          <div class="history-item-footer">
            <span class="history-meta-item">Devices: <code>${devices}</code></span>
            <span class="history-meta-item">Started: ${item.startTime}</span>
            <span class="history-meta-item">Resolved: ${item.resolvedAt}</span>
          </div>
        </li>
      `;
    }).join('');
  }

  // Hook into NetOpsIncidents lifecycle transitions if available
  function attachIncidentsHook() {
    if (window.NetOpsIncidents && typeof window.NetOpsIncidents.updateStatus === 'function') {
      const originalUpdateStatus = window.NetOpsIncidents.updateStatus;
      window.NetOpsIncidents.updateStatus = function (incidentId, newStatus) {
        const result = originalUpdateStatus.apply(this, arguments);
        if (newStatus === 'Resolved') {
          const match = window.NetOpsIncidents.data.find(i => i.id === incidentId);
          if (match) {
            pushResolvedIncident(match);
          }
        }
        return result;
      };
    }
  }

  // Init on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHistoryState();
      renderInvestigationHistoryUI();
      attachIncidentsHook();
    });
  } else {
    initHistoryState();
    renderInvestigationHistoryUI();
    attachIncidentsHook();
  }

  // Global export
  window.NetOpsHistory = {
    pushResolvedIncident: pushResolvedIncident,
    render: renderInvestigationHistoryUI,
    getHistory: function () {
      return (window.NetOpsState && window.NetOpsState.data.investigationHistory) || initialInvestigationHistory;
    }
  };
})();
