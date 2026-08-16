/**
 * Device Inventory Module for NetOps Command Center
 */

(function () {
  'use strict';

  // DOM Element References
  let searchInput;
  let statusFilterSelect;
  let deviceTableBody;
  let detailPanel;
  let closePanelBtn;
  let panelOverlay;

  // Detail panel field references
  let detailHostname;
  let detailId;
  let detailType;
  let detailIp;
  let detailStatus;
  let detailRegion;
  let detailLatency;
  let detailUptime;

  let currentSelectedDevice = null;

  /**
   * Render the device table based on search query and status filter
   */
  function renderDeviceTable() {
    if (!deviceTableBody || !window.NetOpsState) return;

    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedStatus = statusFilterSelect ? statusFilterSelect.value : 'all';

    // Retrieve devices from shared state
    const allDevices = window.NetOpsState.getDevices();

    // Filter devices based on search query and status filter
    const filteredDevices = allDevices.filter(device => {
      // Search filter: Hostname or IP
      const matchesSearch = !query || 
        device.hostname.toLowerCase().includes(query) || 
        device.ip.toLowerCase().includes(query);

      // Status filter
      let matchesStatus = true;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'online' || selectedStatus === 'healthy') {
          matchesStatus = device.status === 'healthy';
        } else if (selectedStatus === 'offline' || selectedStatus === 'critical') {
          matchesStatus = device.status === 'critical';
        } else {
          matchesStatus = device.status === selectedStatus;
        }
      }

      return matchesSearch && matchesStatus;
    });

    // Clear existing table content
    deviceTableBody.innerHTML = '';

    if (filteredDevices.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'no-records-row';
      emptyRow.innerHTML = `
        <td colspan="5" class="empty-table-cell">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No devices matching the current filters</p>
          </div>
        </td>
      `;
      deviceTableBody.appendChild(emptyRow);
      return;
    }

    // Render table rows
    filteredDevices.forEach(device => {
      const tr = document.createElement('tr');
      tr.className = 'device-row';
      tr.setAttribute('data-device-id', device.id);
      tr.setAttribute('tabindex', '0');

      // Status Badge Formatting
      const statusLabel = getStatusLabel(device.status);
      const statusClass = getStatusClass(device.status);

      tr.innerHTML = `
        <td class="col-hostname">
          <div class="device-name-container">
            <span class="device-hostname">${escapeHtml(device.hostname)}</span>
            <span class="device-id-sub">${escapeHtml(device.id)}</span>
          </div>
        </td>
        <td class="col-type">
          <span class="device-type-tag">${escapeHtml(device.type)}</span>
        </td>
        <td class="col-ip">
          <code class="ip-code">${escapeHtml(device.ip)}</code>
        </td>
        <td class="col-status">
          <span class="status-badge ${statusClass}">
            <span class="pulse-dot"></span>
            ${escapeHtml(statusLabel)}
          </span>
        </td>
        <td class="col-uptime">
          <span class="uptime-text">${escapeHtml(device.uptime)}</span>
        </td>
      `;

      // Event listener to open detail panel when row is clicked
      tr.addEventListener('click', () => {
        openDeviceDetails(device);
      });

      // Accessibility keyboard trigger (Enter / Space key)
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDeviceDetails(device);
        }
      });

      deviceTableBody.appendChild(tr);
    });
  }

  /**
   * Helper to map device status to user-facing label
   */
  function getStatusLabel(status) {
    switch (status) {
      case 'healthy':
        return 'Online';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Offline';
      default:
        return status;
    }
  }

  /**
   * Helper to map device status to badge CSS class
   */
  function getStatusClass(status) {
    switch (status) {
      case 'healthy':
        return 'status-healthy';
      case 'warning':
        return 'status-warning';
      case 'critical':
        return 'status-critical';
      default:
        return 'status-info';
    }
  }

  /**
   * Open the Device Details slide-out panel with device telemetry
   */
  function openDeviceDetails(device) {
    if (!detailPanel) return;
    currentSelectedDevice = device;

    if (detailHostname) detailHostname.textContent = device.hostname;
    if (detailId) detailId.textContent = device.id;
    if (detailType) detailType.textContent = device.type;
    if (detailIp) detailIp.textContent = device.ip;
    if (detailRegion) detailRegion.textContent = device.region;
    if (detailLatency) detailLatency.textContent = device.latency;
    if (detailUptime) detailUptime.textContent = device.uptime;

    if (detailStatus) {
      detailStatus.textContent = getStatusLabel(device.status);
      detailStatus.className = `status-badge ${getStatusClass(device.status)}`;
    }

    detailPanel.classList.add('open');
    detailPanel.setAttribute('aria-hidden', 'false');
    if (panelOverlay) panelOverlay.classList.add('active');
  }

  /**
   * Close the Device Details slide-out panel
   */
  function closeDeviceDetails() {
    if (!detailPanel) return;
    detailPanel.classList.remove('open');
    detailPanel.setAttribute('aria-hidden', 'true');
    if (panelOverlay) panelOverlay.classList.remove('active');
  }

  /**
   * Execute quick diagnostic on currently selected device
   */
  function triggerQuickDiagnostic(toolName) {
    if (!currentSelectedDevice) return;
    const targetHost = currentSelectedDevice.hostname;

    closeDeviceDetails();

    if (window.NetOpsApp && typeof window.NetOpsApp.navigateTo === 'function') {
      window.NetOpsApp.navigateTo('section-diagnostics', 'Network Diagnostics');
    } else {
      const diagLink = document.querySelector('.nav-link[data-target="section-diagnostics"]');
      if (diagLink) diagLink.click();
    }

    setTimeout(() => {
      const targetSelect = document.getElementById('diag-target-select');
      if (targetSelect) {
        targetSelect.value = targetHost;
      }
      const toolBtn = document.querySelector(`.btn-diag-tool[data-tool="${toolName}"]`);
      if (toolBtn) {
        toolBtn.click();
      }
    }, 100);
  }

  /**
   * Escape HTML helper to prevent XSS
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
   * Initialize Device Inventory Module
   */
  function initInventoryModule() {
    searchInput = document.getElementById('device-search');
    statusFilterSelect = document.getElementById('device-status-filter');
    deviceTableBody = document.getElementById('device-tbody');
    detailPanel = document.getElementById('device-detail-panel');
    closePanelBtn = document.getElementById('close-detail-panel');
    panelOverlay = document.getElementById('panel-overlay');

    // Detail Fields
    detailHostname = document.getElementById('detail-hostname');
    detailId = document.getElementById('detail-id');
    detailType = document.getElementById('detail-type');
    detailIp = document.getElementById('detail-ip');
    detailStatus = document.getElementById('detail-status');
    detailRegion = document.getElementById('detail-region');
    detailLatency = document.getElementById('detail-latency');
    detailUptime = document.getElementById('detail-uptime');

    // Filter event listeners
    if (searchInput) {
      searchInput.addEventListener('input', renderDeviceTable);
    }
    if (statusFilterSelect) {
      statusFilterSelect.addEventListener('change', renderDeviceTable);
    }

    // Slide-out panel close listeners
    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', closeDeviceDetails);
    }
    if (panelOverlay) {
      panelOverlay.addEventListener('click', closeDeviceDetails);
    }

    // Quick diagnostic buttons in detail panel
    if (detailPanel) {
      const quickActionBtns = detailPanel.querySelectorAll('.action-buttons button');
      quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.textContent.trim().toLowerCase();
          if (text.includes('ping')) {
            triggerQuickDiagnostic('Ping');
          } else if (text.includes('traceroute')) {
            triggerQuickDiagnostic('Traceroute');
          }
        });
      });
    }

    // ESC key closes slide-out panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && detailPanel && detailPanel.classList.contains('open')) {
        closeDeviceDetails();
      }
    });

    // Initial render
    renderDeviceTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventoryModule);
  } else {
    initInventoryModule();
  }

  // Export render function globally for module integration
  window.NetOpsInventory = {
    render: renderDeviceTable,
    openDetails: openDeviceDetails,
    closeDetails: closeDeviceDetails,
    triggerQuickDiagnostic: triggerQuickDiagnostic
  };
})();
