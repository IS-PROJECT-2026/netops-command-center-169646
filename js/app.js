/**
 * Application Navigation & Dashboard Rendering for NetOps Command Center
 */

(function () {
  'use strict';

  // Core UI Elements
  let navLinks;
  let pageSections;
  let currentViewTitle;
  let clockElement;

  /**
   * UTC Clock Updater
   */
  function updateClock() {
    clockElement = clockElement || document.getElementById('utc-clock');
    if (!clockElement) return;
    const now = new Date();
    const utcString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    clockElement.textContent = utcString;
  }

  /**
   * Navigation handler
   * Swaps visibility of page sections and updates link active state
   */
  function navigateTo(targetId, targetTitle) {
    navLinks = navLinks || document.querySelectorAll('.nav-link');
    pageSections = pageSections || document.querySelectorAll('.page-section');
    currentViewTitle = currentViewTitle || document.getElementById('current-view-title');

    // Remove active state from all nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });

    // Hide all page sections
    pageSections.forEach(section => {
      section.classList.add('hidden');
      section.classList.remove('active');
    });

    // Find active link and target section
    const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    const activeSection = document.getElementById(targetId);

    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('aria-current', 'page');
    }

    if (activeSection) {
      activeSection.classList.remove('hidden');
      activeSection.classList.add('active');
    }

    if (currentViewTitle && targetTitle) {
      currentViewTitle.textContent = targetTitle;
    }
  }

  /**
   * Render Dashboard Cards dynamically from window.NetOpsState
   */
  function renderDashboard() {
    if (!window.NetOpsState) return;

    // Recalculate metrics dynamically if dashboard calculation is available
    if (window.NetOpsDashboard && typeof window.NetOpsDashboard.calculateMetrics === 'function') {
      window.NetOpsDashboard.calculateMetrics();
    }

    const metrics = window.NetOpsState.getMetrics() || {};
    const incidents = (window.NetOpsIncidents && Array.isArray(window.NetOpsIncidents.data))
      ? window.NetOpsIncidents.data
      : (window.NetOpsState.getIncidents() || []);
    const alerts = window.NetOpsState.getAlerts() || [];
    const events = window.NetOpsState.getEvents() || [];

    // Calculate dynamic device percentages for progress bar
    const totalDevs = metrics.totalDevices || 1;
    const healthyCount = metrics.healthyDevices || 0;
    const warningCount = metrics.warningDevices || 0;
    const criticalCount = metrics.criticalDevices || 0;

    const healthyPct = ((healthyCount / totalDevs) * 100).toFixed(1);
    const warningPct = ((warningCount / totalDevs) * 100).toFixed(1);
    const criticalPct = ((criticalCount / totalDevs) * 100).toFixed(1);

    // Dynamic operational badge status
    let healthBadgeClass = 'status-healthy';
    let healthBadgeText = 'Operational';
    if (criticalCount > 0) {
      healthBadgeClass = 'status-critical';
      healthBadgeText = 'Degraded';
    } else if (warningCount > 0) {
      healthBadgeClass = 'status-warning';
      healthBadgeText = 'Warning';
    }

    // 1. Render Network Health Card Content
    const healthCard = document.getElementById('card-network-health');
    if (healthCard) {
      healthCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Network Health Overview</h3>
          </div>
          <span class="status-badge ${healthBadgeClass}"><span class="pulse-dot"></span> ${healthBadgeText}</span>
        </div>
        <div class="health-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">System Uptime</span>
            <span class="metric-value text-healthy">${escapeHtml(metrics.uptime || '99.94%')}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Packet Loss</span>
            <span class="metric-value text-healthy">${escapeHtml(metrics.packetLoss || '0.02%')}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Total Devices</span>
            <span class="metric-value">${totalDevs}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Healthy</span>
            <span class="metric-value text-healthy">${healthyCount}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Warnings</span>
            <span class="metric-value text-warning">${warningCount}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Critical</span>
            <span class="metric-value text-critical">${criticalCount}</span>
          </div>
        </div>
        <div class="health-progress-bar">
          <div class="progress-fill healthy-fill" style="width: ${healthyPct}%;" title="Healthy: ${healthyPct}%"></div>
          <div class="progress-fill warning-fill" style="width: ${warningPct}%;" title="Warning: ${warningPct}%"></div>
          <div class="progress-fill critical-fill" style="width: ${criticalPct}%;" title="Critical: ${criticalPct}%"></div>
        </div>
      `;
    }

    // 2. Render Active Incidents Card Content
    const incidentsCard = document.getElementById('card-active-incidents');
    if (incidentsCard) {
      const activeIncidents = incidents.filter(i => (i.status || '').toLowerCase() !== 'resolved');
      
      let incidentsHTML = '';
      if (activeIncidents.length === 0) {
        incidentsHTML = `
          <li class="incident-item-empty">
            <p class="text-muted">✓ No active incidents detected. All services operating normally.</p>
          </li>
        `;
      } else {
        incidentsHTML = activeIncidents.map(inc => {
          const rawSev = (inc.severity || 'medium').toLowerCase();
          const sevClass = (rawSev === 'high' || rawSev === 'critical') ? 'critical' : (rawSev === 'low' ? 'low' : 'warning');
          const devices = inc.affectedDevices || inc.affected_devices || [];
          const devText = Array.isArray(devices) ? devices.join(', ') : devices;
          const timeVal = inc.startTime || inc.timestamp || '';
          const timeFormatted = timeVal.includes(' ') ? timeVal.split(' ')[1] : timeVal;

          return `
            <li class="incident-item severity-${sevClass}">
              <div class="incident-header">
                <span class="incident-id">${escapeHtml(inc.id)}</span>
                <span class="severity-badge badge-${sevClass}">${escapeHtml((inc.severity || 'Medium').toUpperCase())}</span>
              </div>
              <div class="incident-title">${escapeHtml(inc.title)}</div>
              <div class="incident-meta">
                <span>Devices: ${escapeHtml(devText)}</span>
                <span>Started: ${escapeHtml(timeFormatted || 'Recent')}</span>
              </div>
            </li>
          `;
        }).join('');
      }

      incidentsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3>Active Incidents</h3>
          </div>
          <span class="count-badge ${activeIncidents.length > 0 ? 'badge-critical' : 'badge-healthy'}">${activeIncidents.length}</span>
        </div>
        <ul class="incidents-list">
          ${incidentsHTML}
        </ul>
      `;
    }

    // 3. Render Recent Events Card Content
    const eventsCard = document.getElementById('card-recent-events');
    if (eventsCard) {
      let eventsHTML = events.map(evt => `
        <li class="event-item">
          <span class="event-time">${escapeHtml(evt.time)}</span>
          <div class="event-body">
            <span class="event-device">[${escapeHtml(evt.device)}]</span>
            <span class="event-msg">${escapeHtml(evt.message)}</span>
          </div>
          <span class="event-tag">${escapeHtml(evt.category)}</span>
        </li>
      `).join('');

      eventsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Recent System Events</h3>
          </div>
          <span class="count-badge badge-info">Realtime</span>
        </div>
        <ul class="events-list">
          ${eventsHTML}
        </ul>
      `;
    }

    // 4. Render System Alerts Card Content
    const alertsCard = document.getElementById('card-system-alerts');
    if (alertsCard) {
      let alertsHTML = alerts.map(alt => {
        const sev = (alt.severity || 'warning').toLowerCase();
        return `
          <li class="alert-item alert-${sev}">
            <div class="alert-top">
              <span class="alert-code">${escapeHtml(alt.code)}</span>
              <span class="alert-time">${escapeHtml(alt.time)}</span>
            </div>
            <div class="alert-msg">${escapeHtml(alt.message)}</div>
          </li>
        `;
      }).join('');

      alertsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3>System Alerts</h3>
          </div>
          <span class="count-badge badge-warning">${alerts.length}</span>
        </div>
        <ul class="alerts-list">
          ${alertsHTML}
        </ul>
      `;
    }
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
   * Initialize Application Navigation and Listeners
   */
  function initApp() {
    navLinks = document.querySelectorAll('.nav-link');
    pageSections = document.querySelectorAll('.page-section');
    currentViewTitle = document.getElementById('current-view-title');
    clockElement = document.getElementById('utc-clock');

    updateClock();
    setInterval(updateClock, 1000);

    // Bind click handlers to navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const targetTitle = link.getAttribute('data-title') || link.textContent.trim();
        navigateTo(targetId, targetTitle);
      });
    });

    // Initial render
    renderDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.NetOpsApp = {
    navigateTo: navigateTo,
    renderDashboard: renderDashboard
  };
})();
