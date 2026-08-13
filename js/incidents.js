/**
 * Incident Response Core Module for NetOps Command Center
 * Manages incident data model, UI panel rendering, and incident lifecycle transitions.
 */

(function () {
  'use strict';

  // Incident Data Model
  const initialIncidents = [
    {
      id: "INC-9001",
      title: "Core Router Transit Flap - US East",
      severity: "High",
      status: "Detected",
      affected_devices: ["core-router-01.dc1", "edge-router-01.eu1"],
      description: "BGP path oscillation causing 15% latency increase across transatlantic circuit.",
      timestamp: "2026-08-13 20:15:00"
    },
    {
      id: "INC-9002",
      title: "Security Gateway High CPU & Latency Spike",
      severity: "High",
      status: "Investigating",
      affected_devices: ["sec-gateway-02.ap1"],
      description: "SSL termination process memory leak driving CPU utilization above 94%.",
      timestamp: "2026-08-13 19:42:00"
    },
    {
      id: "INC-9003",
      title: "Distribution Switch Memory Pool Exhaustion",
      severity: "Medium",
      status: "Mitigated",
      affected_devices: ["dist-switch-01.dc1"],
      description: "MAC table overflow. Rate limiting enabled on untrusted ingress ports.",
      timestamp: "2026-08-13 18:05:00"
    },
    {
      id: "INC-9004",
      title: "Access Switch Port CRC Error Threshold Exceeded",
      severity: "Low",
      status: "Detected",
      affected_devices: ["access-sw-44.us2"],
      description: "Physical layer degradation detected on port Eth1/24 SFP interface.",
      timestamp: "2026-08-13 16:30:00"
    },
    {
      id: "INC-9005",
      title: "Firewall Redundant PSU Voltage Anomaly",
      severity: "Low",
      status: "Resolved",
      affected_devices: ["fw-cluster-main.dc1"],
      description: "Primary feed voltage fluctuation normalized after ATS failover.",
      timestamp: "2026-08-13 11:20:00"
    }
  ];

  // Lifecycle States sequential order
  const LIFECYCLE_STATES = ["Detected", "Investigating", "Mitigated", "Resolved"];

  let incidentsStore = [...initialIncidents];

  /**
   * Update an incident's status through the lifecycle
   */
  function updateIncidentStatus(incidentId, newStatus) {
    const incident = incidentsStore.find(inc => inc.id === incidentId);
    if (!incident) return false;

    if (!LIFECYCLE_STATES.includes(newStatus)) {
      console.error(`Invalid status transition: ${newStatus}`);
      return false;
    }

    incident.status = newStatus;

    // Update global state sync if present
    if (window.NetOpsState && window.NetOpsState.data) {
      const globalMatch = window.NetOpsState.data.incidents.find(i => i.id === incidentId);
      if (globalMatch) {
        globalMatch.status = newStatus.toLowerCase();
      }
    }

    // Re-render Panel UI
    renderIncidentsPanel();

    // Trigger dashboard update if function exists
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

    const currentIndex = LIFECYCLE_STATES.indexOf(incident.status);
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
      if (filterStatus !== 'all' && inc.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterSeverity !== 'all' && inc.severity.toLowerCase() !== filterSeverity.toLowerCase()) return false;
      if (searchQuery) {
        const matchesTitle = inc.title.toLowerCase().includes(searchQuery);
        const matchesId = inc.id.toLowerCase().includes(searchQuery);
        const matchesDevice = (inc.affected_devices || []).some(d => d.toLowerCase().includes(searchQuery));
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
      const severityClass = (inc.severity || 'medium').toLowerCase();
      const statusClass = (inc.status || 'detected').toLowerCase();
      const affectedList = inc.affected_devices || [];

      const devicesBadges = affectedList.map(dev => 
        `<span class="device-tag"><code class="dev-code">${dev}</code></span>`
      ).join('');

      const currentIndex = LIFECYCLE_STATES.indexOf(inc.status);
      const hasNext = currentIndex >= 0 && currentIndex < LIFECYCLE_STATES.length - 1;
      const nextStatusName = hasNext ? LIFECYCLE_STATES[currentIndex + 1] : null;

      // Build interactive Lifecycle step buttons
      const lifecycleStepsHTML = LIFECYCLE_STATES.map((state, idx) => {
        const isActive = inc.status === state;
        const isPast = currentIndex > idx;
        let stepClass = 'btn-lifecycle-step';
        if (isActive) stepClass += ' active';
        if (isPast) stepClass += ' completed';

        return `
          <button type="button" 
                  class="${stepClass}" 
                  data-id="${inc.id}" 
                  data-status="${state}"
                  aria-label="Set status to ${state}">
            <span class="step-num">${idx + 1}</span>
            <span class="step-text">${state}</span>
          </button>
        `;
      }).join('');

      return `
        <article class="incident-card severity-card-${severityClass}" id="incident-card-${inc.id}">
          <div class="incident-card-header">
            <div class="incident-card-title-group">
              <span class="incident-id-badge">${inc.id}</span>
              <h3 class="incident-card-title">${inc.title}</h3>
            </div>
            <div class="incident-card-badges">
              <span class="severity-badge badge-${severityClass}">${inc.severity.toUpperCase()}</span>
              <span class="status-badge status-badge-${statusClass}">${inc.status}</span>
            </div>
          </div>

          <p class="incident-card-desc">${inc.description || 'Active incident registered in NOC telemetry logs.'}</p>

          <div class="incident-card-meta">
            <div class="meta-item">
              <span class="meta-label">Affected Devices:</span>
              <div class="devices-tags-wrapper">${devicesBadges}</div>
            </div>
            <div class="meta-item">
              <span class="meta-label">Detected Time:</span>
              <span class="meta-val">${inc.timestamp || '2026-08-13 20:00:00'}</span>
            </div>
          </div>

          <!-- Incident Lifecycle Control Bar -->
          <div class="lifecycle-control-panel">
            <span class="lifecycle-label">Lifecycle Stage:</span>
            <div class="lifecycle-stepper-group">
              ${lifecycleStepsHTML}
            </div>
            ${hasNext ? `
              <button type="button" class="btn btn-primary btn-advance-lifecycle" data-id="${inc.id}">
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
    if (detectedEl) detectedEl.textContent = incidentsStore.filter(i => i.status === 'Detected').length;
    if (investigatingEl) investigatingEl.textContent = incidentsStore.filter(i => i.status === 'Investigating').length;
    if (mitigatedEl) mitigatedEl.textContent = incidentsStore.filter(i => i.status === 'Mitigated').length;
    if (resolvedEl) resolvedEl.textContent = incidentsStore.filter(i => i.status === 'Resolved').length;
  }

  /**
   * Create a new incident entry
   */
  function addIncident(data) {
    const newId = `INC-${Math.floor(9000 + Math.random() * 1000)}`;
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newInc = {
      id: newId,
      title: data.title || "Unspecified Incident",
      severity: data.severity || "Medium",
      status: data.status || "Detected",
      affected_devices: data.affected_devices || ["core-router-01.dc1"],
      description: data.description || "Manually logged incident.",
      timestamp: timeStr
    };

    incidentsStore.unshift(newInc);
    renderIncidentsPanel();
    return newInc;
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
            affected_devices: ["edge-router-01.eu1"]
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
