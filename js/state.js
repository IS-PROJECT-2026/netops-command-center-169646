/**
 * Shared State Model for NetOps Command Center
 * Attached to window.NetOpsState for global accessibility across modules
 */

(function () {
  'use strict';

  const initialState = {
    metrics: {
      uptime: "99.94%",
      packetLoss: "0.02%",
      activeAlerts: 5,
      totalDevices: 10,
      healthyDevices: 6,
      warningDevices: 2,
      criticalDevices: 2,
      avgLatency: "60.6 ms",
      bandwidthUsage: "64.8 Gbps"
    },
    devices: [
      { id: "DEV-1001", hostname: "core-router-01.dc1", type: "Router", status: "healthy", ip: "10.0.1.1", region: "US-East (Virginia)", latency: "2ms", uptime: "142d 08h" },
      { id: "DEV-1002", hostname: "core-router-02.dc1", type: "Router", status: "healthy", ip: "10.0.1.2", region: "US-East (Virginia)", latency: "3ms", uptime: "142d 08h" },
      { id: "DEV-1003", hostname: "dist-switch-01.dc1", type: "Switch", status: "warning", ip: "10.0.2.10", region: "US-East (Virginia)", latency: "28ms", uptime: "89d 14h" },
      { id: "DEV-1004", hostname: "fw-cluster-main.dc1", type: "Firewall", status: "healthy", ip: "10.0.0.254", region: "US-East (Virginia)", latency: "1ms", uptime: "210d 03h" },
      { id: "DEV-1005", hostname: "edge-router-01.eu1", type: "Router", status: "critical", ip: "10.2.1.1", region: "EU-West (Frankfurt)", latency: "185ms", uptime: "12d 01h" },
      { id: "DEV-1006", hostname: "lb-app-01.us2", type: "Load Balancer", status: "healthy", ip: "10.1.5.50", region: "US-West (Oregon)", latency: "12ms", uptime: "45d 22h" },
      { id: "DEV-1007", hostname: "access-sw-44.us2", type: "Switch", status: "warning", ip: "10.1.10.44", region: "US-West (Oregon)", latency: "42ms", uptime: "18d 09h" },
      { id: "DEV-1008", hostname: "sec-gateway-02.ap1", type: "Firewall", status: "critical", ip: "10.4.0.1", region: "AP-East (Tokyo)", latency: "240ms", uptime: "4d 11h" },
      { id: "DEV-1009", hostname: "core-switch-01.ap1", type: "Switch", status: "healthy", ip: "10.4.1.5", region: "AP-East (Tokyo)", latency: "88ms", uptime: "301d 19h" },
      { id: "DEV-1010", hostname: "dns-auth-01.global", type: "Server", status: "healthy", ip: "1.1.1.10", region: "Global Anycast", latency: "5ms", uptime: "512d 04h" }
    ],
    incidents: [
      {
        id: "INC-9001",
        title: "Core Router Transit Flap - US East",
        severity: "High",
        status: "Detected",
        affectedDevices: ["core-router-01.dc1", "edge-router-01.eu1"],
        affected_devices: ["core-router-01.dc1", "edge-router-01.eu1"],
        startTime: "2026-08-16 20:15:00",
        timestamp: "2026-08-16 20:15:00",
        description: "BGP path oscillation causing 15% latency increase across transatlantic circuit."
      },
      {
        id: "INC-9002",
        title: "Security Gateway High CPU & Latency Spike",
        severity: "High",
        status: "Investigating",
        affectedDevices: ["sec-gateway-02.ap1"],
        affected_devices: ["sec-gateway-02.ap1"],
        startTime: "2026-08-16 19:42:00",
        timestamp: "2026-08-16 19:42:00",
        description: "SSL termination process memory leak driving CPU utilization above 94%."
      },
      {
        id: "INC-9003",
        title: "Distribution Switch Memory Pool Exhaustion",
        severity: "Medium",
        status: "Mitigated",
        affectedDevices: ["dist-switch-01.dc1"],
        affected_devices: ["dist-switch-01.dc1"],
        startTime: "2026-08-16 18:05:00",
        timestamp: "2026-08-16 18:05:00",
        description: "MAC table overflow. Rate limiting enabled on untrusted ingress ports."
      },
      {
        id: "INC-9004",
        title: "Access Switch Port CRC Error Threshold Exceeded",
        severity: "Low",
        status: "Detected",
        affectedDevices: ["access-sw-44.us2"],
        affected_devices: ["access-sw-44.us2"],
        startTime: "2026-08-16 16:30:00",
        timestamp: "2026-08-16 16:30:00",
        description: "Physical layer degradation detected on port Eth1/24 SFP interface."
      },
      {
        id: "INC-9005",
        title: "Firewall Redundant PSU Voltage Anomaly",
        severity: "Low",
        status: "Resolved",
        affectedDevices: ["fw-cluster-main.dc1"],
        affected_devices: ["fw-cluster-main.dc1"],
        startTime: "2026-08-16 11:20:00",
        timestamp: "2026-08-16 11:20:00",
        description: "Primary feed voltage fluctuation normalized after ATS automatic failover."
      }
    ],
    alerts: [
      { id: "ALT-501", time: "20:49:12", code: "BGP_FLAP", message: "BGP Peer 194.12.0.4 state changed to Down", severity: "critical" },
      { id: "ALT-502", time: "20:45:03", code: "HIGH_CPU", message: "sec-gateway-02.ap1 CPU usage > 92%", severity: "critical" },
      { id: "ALT-503", time: "20:38:50", code: "MEM_THRESHOLD", message: "dist-switch-01.dc1 RAM pool at 88%", severity: "warning" },
      { id: "ALT-504", time: "20:31:15", code: "LATENCY_SLA", message: "US-West to AP-East RTT high (240ms)", severity: "warning" },
      { id: "ALT-505", time: "20:15:00", code: "FAN_SPEED", message: "edge-router-01.eu1 Fan #3 speed variation", severity: "info" }
    ],
    events: [
      { id: "EVT-9941", time: "20:51:04", device: "core-router-01.dc1", message: "Config backup successfully committed to vault", category: "System" },
      { id: "EVT-9940", time: "20:49:12", device: "edge-router-01.eu1", message: "Interface TenGigE0/0/1 line protocol state changed to DOWN", category: "Network" },
      { id: "EVT-9939", time: "20:45:03", device: "sec-gateway-02.ap1", message: "DDoS Mitigation rule rule-882 triggered automatically", category: "Security" },
      { id: "EVT-9938", time: "20:40:11", device: "lb-app-01.us2", message: "SSL certificate renewed automatically via ACME", category: "Security" },
      { id: "EVT-9937", time: "20:35:22", device: "dns-auth-01.global", message: "Zone transfer complete for datacenter.internal", category: "DNS" },
      { id: "EVT-9936", time: "20:30:00", device: "dist-switch-01.dc1", message: "SNMP agent query response timeout cleared", category: "Monitoring" }
    ]
  };

  // State object exposed globally
  window.NetOpsState = {
    data: initialState,
    
    // Helper getter methods
    getMetrics() {
      return this.data.metrics;
    },
    getDevices(filterStatus = null) {
      if (!filterStatus) return this.data.devices;
      return this.data.devices.filter(d => d.status === filterStatus);
    },
    getIncidents(filterSeverity = null) {
      if (!filterSeverity) return this.data.incidents;
      return this.data.incidents.filter(i => (i.severity || '').toLowerCase() === filterSeverity.toLowerCase());
    },
    getAlerts() {
      return this.data.alerts;
    },
    getEvents() {
      return this.data.events;
    }
  };
})();
