/**
 * Network Topology Map Module for NetOps Command Center
 */

(function () {
  'use strict';

  let topologyContainer;
  let svgCanvas;
  let nodesContainer;
  let nodeDetailsModal;

  // Predefined connections between devices by ID
  const topologyLinks = [
    { from: "DEV-1001", to: "DEV-1003", label: "10GbE Trunk" },
    { from: "DEV-1001", to: "DEV-1004", label: "20GbE LAG" },
    { from: "DEV-1002", to: "DEV-1003", label: "10GbE Trunk" },
    { from: "DEV-1002", to: "DEV-1005", label: "Transatlantic Fiber" },
    { from: "DEV-1003", to: "DEV-1006", label: "1GbE Link" },
    { from: "DEV-1003", to: "DEV-1007", label: "1GbE Trunk" },
    { from: "DEV-1004", to: "DEV-1008", label: "IPSec Tunnel" },
    { from: "DEV-1005", to: "DEV-1009", label: "10GbE Fiber" },
    { from: "DEV-1006", to: "DEV-1010", label: "Anycast Route" },
    { from: "DEV-1008", to: "DEV-1009", label: "Secure Link" }
  ];

  /**
   * Group devices into standard Network Architecture Tiers
   */
  function categorizeDevicesIntoTiers(devices) {
    const tiers = {
      core: [],
      distribution: [],
      edge: []
    };

    devices.forEach(device => {
      if (device.type === 'Router' || device.type === 'Firewall') {
        if (device.hostname.includes('core') || device.hostname.includes('fw')) {
          tiers.core.push(device);
        } else {
          tiers.distribution.push(device);
        }
      } else if (device.type === 'Switch' || device.type === 'Load Balancer') {
        if (device.hostname.includes('dist') || device.hostname.includes('lb')) {
          tiers.distribution.push(device);
        } else {
          tiers.edge.push(device);
        }
      } else {
        tiers.edge.push(device);
      }
    });

    return tiers;
  }

  /**
   * Get Device Icon SVG based on type
   */
  function getDeviceIconSvg(type) {
    switch (type) {
      case 'Router':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-type-icon">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8l4 4-4 4M12 8L8 12l4 4" />
        </svg>`;
      case 'Switch':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-type-icon">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01" />
        </svg>`;
      case 'Firewall':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-type-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>`;
      case 'Load Balancer':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-type-icon">
          <path d="M4 6h16M4 12h16M4 18h16M9 6v12M15 6v12" />
        </svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-type-icon">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6v6H9z" />
        </svg>`;
    }
  }

  /**
   * Render Topology Nodes & Connections
   */
  function renderTopology() {
    if (!topologyContainer || !window.NetOpsState) return;

    const devices = window.NetOpsState.getDevices();
    const tiers = categorizeDevicesIntoTiers(devices);

    // Clear nodes container
    nodesContainer.innerHTML = '';
    svgCanvas.innerHTML = '';

    // Create Tier Containers
    const tierNames = [
      { key: 'core', label: 'Core Tier' },
      { key: 'distribution', label: 'Distribution & Security Tier' },
      { key: 'edge', label: 'Access & Edge Tier' }
    ];

    tierNames.forEach(tier => {
      const tierEl = document.createElement('div');
      tierEl.className = `topology-tier tier-${tier.key}`;
      tierEl.innerHTML = `<div class="tier-header"><span class="tier-badge">${tier.label}</span></div>`;

      const tierNodesGroup = document.createElement('div');
      tierNodesGroup.className = 'tier-nodes-group';

      tiers[tier.key].forEach(device => {
        const node = document.createElement('div');
        node.className = `topology-node status-${device.status}`;
        node.setAttribute('data-device-id', device.id);
        node.setAttribute('tabindex', '0');

        const statusDotClass = device.status === 'healthy' ? 'status-healthy' :
                               (device.status === 'warning' ? 'status-warning' : 'status-critical');

        node.innerHTML = `
          <div class="node-header">
            <span class="pulse-dot ${statusDotClass}"></span>
            <span class="node-id">${escapeHtml(device.id)}</span>
          </div>
          <div class="node-body">
            ${getDeviceIconSvg(device.type)}
            <div class="node-info">
              <span class="node-hostname">${escapeHtml(device.hostname)}</span>
              <span class="node-ip">${escapeHtml(device.ip)}</span>
            </div>
          </div>
          <div class="node-footer">
            <span class="node-type-badge">${escapeHtml(device.type)}</span>
            <span class="node-latency">${escapeHtml(device.latency)}</span>
          </div>
        `;

        // Click handler: Open details panel if available
        node.addEventListener('click', () => {
          if (window.NetOpsInventory && typeof window.NetOpsInventory.openDetails === 'function') {
            window.NetOpsInventory.openDetails(device);
          } else {
            showNodeTooltip(node, device);
          }
        });

        // Hover effect: highlight connections
        node.addEventListener('mouseenter', () => highlightConnections(device.id));
        node.addEventListener('mouseleave', clearHighlights);

        tierNodesGroup.appendChild(node);
      });

      tierEl.appendChild(tierNodesGroup);
      nodesContainer.appendChild(tierEl);
    });

    // Draw SVG Link Lines after DOM layout renders
    requestAnimationFrame(() => {
      drawTopologyLinks();
    });
  }

  /**
   * Draw SVG Lines connecting topology nodes
   */
  function drawTopologyLinks() {
    if (!svgCanvas || !topologyContainer) return;

    svgCanvas.innerHTML = '';
    const containerRect = topologyContainer.getBoundingClientRect();

    // Set SVG canvas dimensions
    svgCanvas.setAttribute('width', containerRect.width);
    svgCanvas.setAttribute('height', containerRect.height);

    topologyLinks.forEach(link => {
      const fromEl = nodesContainer.querySelector(`[data-device-id="${link.from}"]`);
      const toEl = nodesContainer.querySelector(`[data-device-id="${link.to}"]`);

      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      // Calculate relative center coordinates
      const x1 = (fromRect.left + fromRect.width / 2) - containerRect.left;
      const y1 = (fromRect.top + fromRect.height / 2) - containerRect.top;
      const x2 = (toRect.left + toRect.width / 2) - containerRect.left;
      const y2 = (toRect.top + toRect.height / 2) - containerRect.top;

      // Determine link status color based on connected devices
      const fromDevice = window.NetOpsState.getDevices().find(d => d.id === link.from);
      const toDevice = window.NetOpsState.getDevices().find(d => d.id === link.to);

      let linkStatus = 'healthy';
      if (fromDevice?.status === 'critical' || toDevice?.status === 'critical') {
        linkStatus = 'critical';
      } else if (fromDevice?.status === 'warning' || toDevice?.status === 'warning') {
        linkStatus = 'warning';
      }

      // Create SVG Path for bezier dynamic connection line
      const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const deltaY = y2 - y1;
      const cp1y = y1 + deltaY * 0.5;
      const cp2y = y2 - deltaY * 0.5;

      const d = `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`;
      svgPath.setAttribute('d', d);
      svgPath.setAttribute('class', `topology-link link-status-${linkStatus}`);
      svgPath.setAttribute('data-from', link.from);
      svgPath.setAttribute('data-to', link.to);

      svgCanvas.appendChild(svgPath);
    });
  }

  /**
   * Highlight connections for a specific device node
   */
  function highlightConnections(deviceId) {
    const allLinks = svgCanvas.querySelectorAll('.topology-link');
    allLinks.forEach(link => {
      const from = link.getAttribute('data-from');
      const to = link.getAttribute('data-to');
      if (from === deviceId || to === deviceId) {
        link.classList.add('highlighted');
      } else {
        link.classList.add('dimmed');
      }
    });
  }

  /**
   * Clear node and link highlights
   */
  function clearHighlights() {
    const allLinks = svgCanvas.querySelectorAll('.topology-link');
    allLinks.forEach(link => {
      link.classList.remove('highlighted', 'dimmed');
    });
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
   * Show fallback node tooltip if inventory module detail panel is missing
   */
  function showNodeTooltip(node, device) {
    alert(`Device Details:\nHostname: ${device.hostname}\nIP: ${device.ip}\nStatus: ${device.status.toUpperCase()}\nLatency: ${device.latency}`);
  }

  /**
   * Initialize Topology Map Module
   */
  function initTopologyModule() {
    topologyContainer = document.getElementById('topology-map-container');
    svgCanvas = document.getElementById('topology-svg-canvas');
    nodesContainer = document.getElementById('topology-nodes-container');

    if (!topologyContainer || !nodesContainer) return;

    renderTopology();

    // Re-draw links on window resize
    window.addEventListener('resize', () => {
      drawTopologyLinks();
    });

    // Re-draw links when navigation tab switches to topology
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-target="section-topology"]')) {
        setTimeout(renderTopology, 50);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopologyModule);
  } else {
    initTopologyModule();
  }

  window.NetOpsTopology = {
    render: renderTopology,
    redrawLinks: drawTopologyLinks
  };
})();
