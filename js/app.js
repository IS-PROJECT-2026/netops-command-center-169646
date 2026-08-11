/**
 * Application Navigation & Rendering for NetOps Command Center
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Core UI Elements
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');
  const currentViewTitle = document.getElementById('current-view-title');
  const clockElement = document.getElementById('utc-clock');

  /**
   * UTC Clock Updater
   */
  function updateClock() {
    if (!clockElement) return;
    const now = new Date();
    const utcString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    clockElement.textContent = utcString;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /**
   * Navigation handler
   * Swaps visibility of page sections and updates link active state
   */
  function navigateTo(targetId, targetTitle) {
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

  // Bind click handlers to navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetTitle = link.getAttribute('data-title') || link.textContent.trim();
      navigateTo(targetId, targetTitle);
    });
  });

  /**
   * Render Dashboard Cards dynamically from window.NetOpsState
   */
  function renderDashboard() {
    if (!window.NetOpsState) return;

    const metrics = window.NetOpsState.getMetrics();
    const incidents = window.NetOpsState.getIncidents();
    const alerts = window.NetOpsState.getAlerts();
    const events = window.NetOpsState.getEvents();

    // 1. Render Network Health Card Content
    const healthCard = document.getElementById('card-network-health');
    if (healthCard) {
      healthCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Network Health Overview</h3>
          </div>
          <span class="status-badge status-healthy"><span class="pulse-dot"></span> Operational</span>
        </div>
        <div class="health-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">System Uptime</span>
            <span class="metric-value text-healthy">${metrics.uptime}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Packet Loss</span>
            <span class="metric-value text-healthy">${metrics.packetLoss}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Total Devices</span>
            <span class="metric-value">${metrics.totalDevices}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Healthy</span>
            <span class="metric-value text-healthy">${metrics.healthyDevices}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Warnings</span>
            <span class="metric-value text-warning">${metrics.warningDevices}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Critical</span>
            <span class="metric-value text-critical">${metrics.criticalDevices}</span>
          </div>
        </div>
        <div class="health-progress-bar">
          <div class="progress-fill healthy-fill" style="width: 92%;"></div>
          <div class="progress-fill warning-fill" style="width: 6%;"></div>
          <div class="progress-fill critical-fill" style="width: 2%;"></div>
        </div>
      `;
    }

    // 2. Render Active Incidents Card Content
    const incidentsCard = document.getElementById('card-active-incidents');
    if (incidentsCard) {
      const activeIncidents = incidents.filter(i => i.status !== 'resolved');
      let incidentsHTML = activeIncidents.map(inc => `
        <li class="incident-item severity-${inc.severity}">
          <div class="incident-header">
            <span class="incident-id">${inc.id}</span>
            <span class="severity-badge badge-${inc.severity}">${inc.severity.toUpperCase()}</span>
          </div>
          <div class="incident-title">${inc.title}</div>
          <div class="incident-meta">
            <span>Devices: ${inc.affectedDevices.join(', ')}</span>
            <span>Started: ${inc.startTime.split(' ')[1]}</span>
          </div>
        </li>
      `).join('');

      incidentsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3>Active Incidents</h3>
          </div>
          <span class="count-badge badge-critical">${activeIncidents.length}</span>
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
          <span class="event-time">${evt.time}</span>
          <div class="event-body">
            <span class="event-device">[${evt.device}]</span>
            <span class="event-msg">${evt.message}</span>
          </div>
          <span class="event-tag">${evt.category}</span>
        </li>
      `).join('');

      eventsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      let alertsHTML = alerts.map(alt => `
        <li class="alert-item alert-${alt.severity}">
          <div class="alert-top">
            <span class="alert-code">${alt.code}</span>
            <span class="alert-time">${alt.time}</span>
          </div>
          <div class="alert-msg">${alt.message}</div>
        </li>
      `).join('');

      alertsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  // Initial render call
  renderDashboard();
});
