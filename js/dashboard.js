/**
 * Dashboard Metrics & Simulated Event Stream Ticker for NetOps Command Center
 */

(function () {
  'use strict';

  let eventTickerTrack;

  // Pool of realistic NOC simulation event templates
  const eventTemplates = [
    { device: "dist-switch-01.dc1", message: "BGP route flap detected on peer interface Eth1/2", category: "Network" },
    { device: "edge-router-01.eu1", message: "Interface TenGigE0/0/2 link flap restored to UP", category: "Network" },
    { device: "sec-gateway-02.ap1", message: "DDoS Mitigation filter applied: Rate-limit 50k pps", category: "Security" },
    { device: "access-sw-44.us2", message: "High CRC errors detected on port Gi0/12", category: "Hardware" },
    { device: "lb-app-01.us2", message: "Health check probe latency spike to 140ms on pool backend-us2", category: "Monitoring" },
    { device: "fw-cluster-main.dc1", message: "IPSec VPN Tunnel SA re-key completed with remote peer", category: "Security" },
    { device: "dns-auth-01.global", message: "DNS query rate burst: 45,000 QPS processed cleanly", category: "DNS" },
    { device: "core-router-02.dc1", message: "OSPF Neighbor state changed to FULL on interface Vlan100", category: "Routing" }
  ];

  /**
   * Calculate network metrics dynamically from shared state
   */
  function calculateMetrics() {
    if (!window.NetOpsState) return null;

    const devices = window.NetOpsState.getDevices();
    const totalDevices = devices.length;

    if (totalDevices === 0) {
      return {
        totalDevices: 0,
        percentOnline: "0%",
        avgLatency: "0 ms",
        activeWarnings: 0,
        healthyCount: 0,
        warningCount: 0,
        criticalCount: 0
      };
    }

    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalLatencyMs = 0;

    devices.forEach(device => {
      if (device.status === 'healthy') {
        healthyCount++;
      } else if (device.status === 'warning') {
        warningCount++;
      } else if (device.status === 'critical') {
        criticalCount++;
      }

      // Parse latency numerical value (e.g., "185ms" -> 185)
      const latencyMatch = device.latency ? device.latency.match(/\d+/) : null;
      if (latencyMatch) {
        totalLatencyMs += parseInt(latencyMatch[0], 10);
      }
    });

    const percentOnline = ((healthyCount / totalDevices) * 100).toFixed(1) + '%';
    const avgLatency = (totalLatencyMs / totalDevices).toFixed(1) + ' ms';

    return {
      totalDevices,
      percentOnline,
      avgLatency,
      activeWarnings: warningCount,
      healthyCount,
      warningCount,
      criticalCount
    };
  }

  /**
   * Update Dashboard High-Level Metric Cards UI
   */
  function renderMetricsUI() {
    const metrics = calculateMetrics();
    if (!metrics) return;

    // Total Devices Card
    const totalDevicesEl = document.getElementById('metric-total-devices');
    if (totalDevicesEl) totalDevicesEl.textContent = metrics.totalDevices;

    // Percent Online Card
    const percentOnlineEl = document.getElementById('metric-percent-online');
    if (percentOnlineEl) percentOnlineEl.textContent = metrics.percentOnline;

    // Average Latency Card
    const avgLatencyEl = document.getElementById('metric-avg-latency');
    if (avgLatencyEl) avgLatencyEl.textContent = metrics.avgLatency;

    // Active Warnings Card
    const activeWarningsEl = document.getElementById('metric-active-warnings');
    if (activeWarningsEl) activeWarningsEl.textContent = metrics.activeWarnings;

    // Update shared state metrics object as well
    if (window.NetOpsState && window.NetOpsState.data) {
      window.NetOpsState.data.metrics.totalDevices = metrics.totalDevices;
      window.NetOpsState.data.metrics.healthyDevices = metrics.healthyCount;
      window.NetOpsState.data.metrics.warningDevices = metrics.warningCount;
      window.NetOpsState.data.metrics.criticalDevices = metrics.criticalCount;
      window.NetOpsState.data.metrics.avgLatency = metrics.avgLatency;
    }
  }

  /**
   * Render Event Stream Ticker
   */
  function renderEventTicker() {
    eventTickerTrack = document.getElementById('event-ticker-track');
    if (!eventTickerTrack || !window.NetOpsState) return;

    const events = window.NetOpsState.getEvents();

    const tickerItemsHTML = events.map(evt => `
      <div class="ticker-item">
        <span class="ticker-time">${escapeHtml(evt.time)}</span>
        <span class="ticker-device">[${escapeHtml(evt.device)}]</span>
        <span class="ticker-msg">${escapeHtml(evt.message)}</span>
        <span class="ticker-tag">${escapeHtml(evt.category)}</span>
      </div>
    `).join('');

    // Duplicate ticker items for smooth continuous loop
    eventTickerTrack.innerHTML = tickerItemsHTML + tickerItemsHTML;
  }

  /**
   * Push simulated network event every 15 seconds
   */
  function startSimulatedEventStream() {
    setInterval(() => {
      if (!window.NetOpsState) return;

      const randomTemplate = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const newEvent = {
        id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        device: randomTemplate.device,
        message: randomTemplate.message,
        category: randomTemplate.category
      };

      // Add to shared state events array
      window.NetOpsState.data.events.unshift(newEvent);

      // Keep events capped at 15 items
      if (window.NetOpsState.data.events.length > 15) {
        window.NetOpsState.data.events.pop();
      }

      // Re-render Ticker
      renderEventTicker();

      // Trigger update on recent events list in dashboard if function exists
      const eventsCard = document.getElementById('card-recent-events');
      if (eventsCard) {
        const eventsList = eventsCard.querySelector('.events-list');
        if (eventsList) {
          const li = document.createElement('li');
          li.className = 'event-item event-item-new';
          li.innerHTML = `
            <span class="event-time">${escapeHtml(newEvent.time)}</span>
            <div class="event-body">
              <span class="event-device">[${escapeHtml(newEvent.device)}]</span>
              <span class="event-msg">${escapeHtml(newEvent.message)}</span>
            </div>
            <span class="event-tag">${escapeHtml(newEvent.category)}</span>
          `;
          eventsList.insertBefore(li, eventsList.firstChild);
          if (eventsList.children.length > 6) {
            eventsList.removeChild(eventsList.lastChild);
          }
        }
      }
    }, 15000);
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
   * Initialize Dashboard Module
   */
  function initDashboardModule() {
    renderMetricsUI();
    renderEventTicker();
    startSimulatedEventStream();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardModule);
  } else {
    initDashboardModule();
  }

  window.NetOpsDashboard = {
    renderMetrics: renderMetricsUI,
    renderTicker: renderEventTicker,
    calculateMetrics: calculateMetrics
  };
})();
