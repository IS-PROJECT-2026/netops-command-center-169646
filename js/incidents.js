/**
 * Incident Response Core Module for NetOps Command Center
 * Manages incident data model, UI panel rendering, and incident lifecycle transitions.
 */

(function () {
  'use strict';

  // Lifecycle States sequential order
  const LIFECYCLE_STATES = ["Detected", "Investigating", "Mitigated", "Resolved"];

  // Incident Data Model
  const initialIncidents = [
    {
      id: "INC-9001",
      title: "Core Router Transit Flap - US East",
      severity: "High",
      status: "Detected",
      affectedDevices: ["core-router-01.dc1", "edge-router-01.eu1"],
      affected_devices: ["core-router-01.dc1", "edge-router-01.eu1"],
      description: "BGP path oscillation causing 15% latency increase across transatlantic circuit.",
      startTime: "2026-08-16 20:15:00",
      timestamp: "2026-08-16 20:15:00"
    },
    {
      id: "INC-9002",
      title: "Security Gateway High CPU & Latency Spike",
      severity: "High",
      status: "Investigating",
      affectedDevices: ["sec-gateway-02.ap1"],
      affected_devices: ["sec-gateway-02.ap1"],
      description: "SSL termination process memory leak driving CPU utilization above 94%.",
      startTime: "2026-08-16 19:42:00",
      timestamp: "2026-08-16 19:42:00"
    },
    {
      id: "INC-9003",
      title: "Distribution Switch Memory Pool Exhaustion",
      severity: "Medium",
      status: "Mitigated",
      affectedDevices: ["dist-switch-01.dc1"],
      affected_devices: ["dist-switch-01.dc1"],
      description: "MAC table overflow. Rate limiting enabled on untrusted ingress ports.",
      startTime: "2026-08-16 18:05:00",
      timestamp: "2026-08-16 18:05:00"
    },
    {
      id: "INC-9004",
      title: "Access Switch Port CRC Error Threshold Exceeded",
      severity: "Low",
      status: "Detected",
      affectedDevices: ["access-sw-44.us2"],
      affected_devices: ["access-sw-44.us2"],
      description: "Physical layer degradation detected on port Eth1/24 SFP interface.",
      startTime: "2026-08-16 16:30:00",
      timestamp: "2026-08-16 16:30:00"
    },
    {
      id: "INC-9005",
      title: "Firewall Redundant PSU Voltage Anomaly",
      severity: "Low",
      status: "Resolved",
      affectedDevices: ["fw-cluster-main.dc1"],
      affected_devices: ["fw-cluster-main.dc1"],
      description: "Primary feed voltage fluctuation normalized after ATS automatic failover.",
      startTime: "2026-08-16 11:20:00",
      timestamp: "2026-08-16 11:20:00"
    }
  ];

  let incidentsStore = [...initialIncidents];

  /**
   * Helper to normalize incident object
   */
  function normalizeIncidentObj(inc) {
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
   * Update an incident's status through the lifecycle
   */
  function updateIncidentStatus(incidentId, newStatus) {
    const incident = incidentsStore.find(inc => inc.id === incidentId);
    if (!incident) return false;

    // Standardize title-case status
    const matchedState = LIFECYCLE_STATES.find(s => s.toLowerCase() === (newStatus || '').toLowerCase());
    if (!matchedState) {
      console.error(`Invalid status transition: ${newStatus}`);
      return false;
    }

    incident.status = matchedState;

    // Update global state sync if present
    if (window.NetOpsState && window.NetOpsState.data && Array.isArray(window.NetOpsState.data.incidents)) {
      const globalMatch = window.NetOpsState.data.incidents.find(i => i.id === incidentId);
      if (globalMatch) {
        globalMatch.status = matchedState;
      }
    }

    // Save to storage
    if (window.NetOpsStorage) {
      window.NetOpsStorage.saveIncidents(incidentsStore);
    }

    // If resolved, push to history
    if (matchedState === 'Resolved' && window.NetOpsHistory && typeof window.NetOpsHistory.pushResolvedIncident === 'function') {
      window.NetOpsHistory.pushResolvedIncident(incident);
    }

    // Re-render Panel UI
    renderIncidentsPanel();

    // Trigger dashboard update
    if (window.NetOpsApp && typeof window.NetOpsApp.renderDashboard === 'function') {
      window.NetOpsApp.renderDashboard();
    }
    if (window.NetOpsDashboard && typeof window.NetOpsDashboard.renderMetrics === 'function') {
      window.NetOpsDashboard.renderMetrics();
    }

    return true;
  }

  /**
   * Move an incident forward to the next lifecycle step
   */
  function advanceIncidentLifecycle(incidentId) {
    const incident = incidentsStore.find(inc => inc.id === incidentId);
    if (!incident) return;

    const currentIndex = LIFECYCLE_STATES.findIndex(s => s.toLowerCase() === (incident.status || '').toLowerCase());
    if (currentIndex >= 0 && currentIndex < LIFECYCLE_STATES.length - 1) {
      updateIncidentStatus(incidentId, LIFECYCLE_STATES[currentIndex + 1]);
    }
  }

  /**
   * Render Incidents into the UI Panel
   */
  function renderIncidentsPanel() {
    const container = document.getElementById('incidents-container');
    if (!container) return;

    const filterStatus = document.getElementById('incident-status-filter')?.value || 'all';
    const filterSeverity = document.getElementById('incident-severity-filter')?.value || 'all';
    const searchQuery = (document.getElementById('incident-search')?.value || '').toLowerCase().trim();

    let filtered = incidentsStore.filter(inc => {
      if (filterStatus !== 'all' && (inc.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterSeverity !== 'all' && (inc.severity || '').toLowerCase() !== filterSeverity.toLowerCase()) return false;
      if (searchQuery) {
        const matchesTitle = (inc.title || '').toLowerCase().includes(searchQuery);
        const matchesId = (inc.id || '').toLowerCase().includes(searchQuery);
        const devices = inc.affectedDevices || inc.affected_devices || [];
        const matchesDevice = devices.some(d => d.toLowerCase().includes(searchQuery));
        if (!matchesTitle && !matchesId && !matchesDevice) return false;
      }
      return true;
    });

    updateSummaryCounters();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-incidents-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4>No Matching Incidents</h4>
          <p>There are no incidents matching your current search or filter criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(inc => {
      const rawSev = (inc.severity || 'medium').toLowerCase();
      const severityClass = (rawSev === 'high' || rawSev === 'critical') ? 'high' : (rawSev === 'low' ? 'low' : 'medium');
      const statusClass = (inc.status || 'detected').toLowerCase();
      const affectedList = inc.affectedDevices || inc.affected_devices || [];

      const devicesBadges = affectedList.map(dev => 
        `<span class="device-tag"><code class="dev-code">${escapeHtml(dev)}</code></span>`
      ).join('');

      const currentIndex = LIFECYCLE_STATES.findIndex(s => s.toLowerCase() === (inc.status || '').toLowerCase());
      const hasNext = currentIndex >= 0 && currentIndex < LIFECYCLE_STATES.length - 1;
      const nextStatusName = hasNext ? LIFECYCLE_STATES[currentIndex + 1] : null;

      // Build interactive Lifecycle step buttons
      const lifecycleStepsHTML = LIFECYCLE_STATES.map((state, idx) => {
        const isActive = (inc.status || '').toLowerCase() === state.toLowerCase();
        const isPast = currentIndex > idx;
        let stepClass = 'btn-lifecycle-step';
        if (isActive) stepClass += ' active';
        if (isPast) stepClass += ' completed';

        return `
          <button type="button" 
                  class="${stepClass}" 
                  data-id="${escapeHtml(inc.id)}" 
                  data-status="${state}"
                  aria-label="Set status to ${state}">
            <span class="step-num">${idx + 1}</span>
            <span class="step-text">${state}</span>
          </button>
        `;
      }).join('');

      return `
        <article class="incident-card severity-card-${severityClass}" id="incident-card-${escapeHtml(inc.id)}">
          <div class="incident-card-header">
            <div class="incident-card-title-group">
              <span class="incident-id-badge">${escapeHtml(inc.id)}</span>
              <h3 class="incident-card-title">${escapeHtml(inc.title)}</h3>
            </div>
            <div class="incident-card-badges">
              <span class="severity-badge badge-${severityClass}">${escapeHtml((inc.severity || 'Medium').toUpperCase())}</span>
              <span class="status-badge status-badge-${statusClass}">${escapeHtml(inc.status || 'Detected')}</span>
            </div>
          </div>

          <p class="incident-card-desc">${escapeHtml(inc.description || 'Active incident registered in NOC telemetry logs.')}</p>

          <div class="incident-card-meta">
            <div class="meta-item">
              <span class="meta-label">Affected Devices:</span>
              <div class="devices-tags-wrapper">${devicesBadges}</div>
            </div>
            <div class="meta-item">
              <span class="meta-label">Detected Time:</span>
              <span class="meta-val">${escapeHtml(inc.startTime || inc.timestamp || '2026-08-16 20:00:00')}</span>
            </div>
          </div>

          <!-- Incident Lifecycle Control Bar -->
          <div class="lifecycle-control-panel">
            <span class="lifecycle-label">Lifecycle Stage:</span>
            <div class="lifecycle-stepper-group">
              ${lifecycleStepsHTML}
            </div>
            ${hasNext ? `
              <button type="button" class="btn btn-primary btn-advance-lifecycle" data-id="${escapeHtml(inc.id)}">
                Advance to ${nextStatusName} &rarr;
              </button>
            ` : `
              <span class="lifecycle-resolved-tag">&check; Incident Resolved</span>
            `}
          </div>
        </article>
      `;
    }).join('');

    // Attach event handlers
    container.querySelectorAll('.btn-lifecycle-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const newStatus = btn.getAttribute('data-status');
        updateIncidentStatus(id, newStatus);
      });
    });

    container.querySelectorAll('.btn-advance-lifecycle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        advanceIncidentLifecycle(id);
      });
    });
  }

  /**
   * Update header counter badges
   */
  function updateSummaryCounters() {
    const totalEl = document.getElementById('count-incidents-total');
    const detectedEl = document.getElementById('count-incidents-detected');
    const investigatingEl = document.getElementById('count-incidents-investigating');
    const mitigatedEl = document.getElementById('count-incidents-mitigated');
    const resolvedEl = document.getElementById('count-incidents-resolved');

    if (totalEl) totalEl.textContent = incidentsStore.length;
    if (detectedEl) detectedEl.textContent = incidentsStore.filter(i => (i.status || '').toLowerCase() === 'detected').length;
    if (investigatingEl) investigatingEl.textContent = incidentsStore.filter(i => (i.status || '').toLowerCase() === 'investigating').length;
    if (mitigatedEl) mitigatedEl.textContent = incidentsStore.filter(i => (i.status || '').toLowerCase() === 'mitigated').length;
    if (resolvedEl) resolvedEl.textContent = incidentsStore.filter(i => (i.status || '').toLowerCase() === 'resolved').length;
  }

  /**
   * Create a new incident entry
   */
  function addIncident(data) {
    const newId = `INC-${Math.floor(9000 + Math.random() * 1000)}`;
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const devices = data.affectedDevices || data.affected_devices || ["core-router-01.dc1"];

    const newInc = {
      id: newId,
      title: data.title || "Unspecified Incident",
      severity: data.severity || "Medium",
      status: data.status || "Detected",
      affectedDevices: devices,
      affected_devices: devices,
      description: data.description || "Manually logged incident.",
      startTime: timeStr,
      timestamp: timeStr
    };

    incidentsStore.unshift(newInc);

    if (window.NetOpsState && window.NetOpsState.data && Array.isArray(window.NetOpsState.data.incidents)) {
      window.NetOpsState.data.incidents.unshift(newInc);
    }

    if (window.NetOpsStorage) {
      window.NetOpsStorage.saveIncidents(incidentsStore);
    }

    renderIncidentsPanel();

    if (window.NetOpsApp && typeof window.NetOpsApp.renderDashboard === 'function') {
      window.NetOpsApp.renderDashboard();
    }

    return newInc;
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
   * Module initialization
   */
  function initIncidentsModule() {
    renderIncidentsPanel();

    const searchInput = document.getElementById('incident-search');
    const statusFilter = document.getElementById('incident-status-filter');
    const severityFilter = document.getElementById('incident-severity-filter');
    const createBtn = document.getElementById('btn-create-incident');

    if (searchInput) searchInput.addEventListener('input', renderIncidentsPanel);
    if (statusFilter) statusFilter.addEventListener('change', renderIncidentsPanel);
    if (severityFilter) severityFilter.addEventListener('change', renderIncidentsPanel);

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        const title = prompt("Enter Incident Title:", "Unexpected Traffic Spike on EU Trunk");
        if (title) {
          addIncident({
            title: title,
            severity: "High",
            status: "Detected",
            affectedDevices: ["edge-router-01.eu1"]
          });
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIncidentsModule);
  } else {
    initIncidentsModule();
  }

  // Global interface export
  window.NetOpsIncidents = {
    data: incidentsStore,
    render: renderIncidentsPanel,
    updateStatus: updateIncidentStatus,
    advanceLifecycle: advanceIncidentLifecycle,
    addIncident: addIncident
  };
})();
