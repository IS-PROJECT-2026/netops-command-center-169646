/**
 * Investigation History Core Module
 * NetOps Command Center
 */

(function () {
  'use strict';

  // Initial Historical Resolved Incidents
  const initialInvestigationHistory = [
    {
      id: "INC-9005",
      title: "Firewall Redundant PSU Voltage Anomaly",
      severity: "Low",
      status: "Resolved",
      affectedDevices: ["fw-cluster-main.dc1"],
      startTime: "2026-08-16 11:20:00",
      resolvedAt: "2026-08-16 12:45:00",
      rootCause: "Primary feed voltage fluctuation normalized after ATS automatic failover to secondary utility feed.",
      confidenceScore: 96
    },
    {
      id: "INC-8890",
      title: "DNS Anycast Node Resolution Delays",
      severity: "High",
      status: "Resolved",
      affectedDevices: ["dns-auth-01.global"],
      startTime: "2026-08-14 14:10:00",
      resolvedAt: "2026-08-14 15:30:00",
      rootCause: "UDP port 53 socket queue exhaustion caused by misconfigured rate-limiter on upstream transit router.",
      confidenceScore: 88
    },
    {
      id: "INC-8875",
      title: "US-West Distribution Switch Packet Drop Burst",
      severity: "Low",
      status: "Resolved",
      affectedDevices: ["access-sw-44.us2"],
      startTime: "2026-08-12 09:15:00",
      resolvedAt: "2026-08-12 10:05:00",
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
    let score = incident.confidenceScore || 92;
    if (window.NetOpsRCA && typeof window.NetOpsRCA.calculateScore === 'function') {
      score = window.NetOpsRCA.calculateScore().score;
    }

    const devices = incident.affectedDevices || incident.affected_devices || ["core-router-01.dc1"];

    const historyRecord = {
      id: incident.id || `INC-${Math.floor(8000 + Math.random() * 1000)}`,
      title: incident.title || "Resolved Incident",
      severity: incident.severity || "Medium",
      status: "Resolved",
      affectedDevices: Array.isArray(devices) ? devices : [devices],
      startTime: incident.startTime || incident.timestamp || resolvedTimeStr,
      resolvedAt: resolvedTimeStr,
      rootCause: incident.description || incident.rootCause || "Incident root cause verified and telemetry restored to operational parameters.",
      confidenceScore: score
    };

    const historyArray = (window.NetOpsState && window.NetOpsState.data.investigationHistory) || initialInvestigationHistory;
    
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
   * Escape HTML helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
      const rawSev = (item.severity || 'medium').toLowerCase();
      const sevClass = (rawSev === 'high' || rawSev === 'critical') ? 'high' : (rawSev === 'low' ? 'low' : 'medium');
      const devicesArr = item.affectedDevices || item.affected_devices || [];
      const devices = Array.isArray(devicesArr) ? devicesArr.join(', ') : devicesArr;

      return `
        <li class="history-item-card">
          <div class="history-item-header">
            <div class="history-title-group">
              <span class="history-id-badge">${escapeHtml(item.id)}</span>
              <h4 class="history-item-title">${escapeHtml(item.title)}</h4>
            </div>
            <div class="history-badges">
              <span class="severity-badge badge-${sevClass}">${escapeHtml((item.severity || 'Medium').toUpperCase())}</span>
              <span class="status-badge status-healthy">✓ RESOLVED</span>
              <span class="rca-score-badge">${item.confidenceScore}% RCA Score</span>
            </div>
          </div>

          <div class="history-item-body">
            <p class="history-cause-text"><strong>Resolution & RCA:</strong> ${escapeHtml(item.rootCause)}</p>
          </div>

          <div class="history-item-footer">
            <span class="history-meta-item">Devices: <code>${escapeHtml(devices)}</code></span>
            <span class="history-meta-item">Started: ${escapeHtml(item.startTime)}</span>
            <span class="history-meta-item">Resolved: ${escapeHtml(item.resolvedAt)}</span>
          </div>
        </li>
      `;
    }).join('');
  }

  // Init on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHistoryState();
      renderInvestigationHistoryUI();
    });
  } else {
    initHistoryState();
    renderInvestigationHistoryUI();
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
