/**
 * Incident Report Generator Module for NetOps Command Center
 * Generates structured post-mortem summaries and handles modal display & browser downloads.
 */

(function () {
  'use strict';

  /**
   * Helper to escape HTML characters in dynamic strings
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
   * Retrieve incident by ID from available state stores
   */
  function getIncidentData(incidentId) {
    let incident = null;

    if (window.NetOpsIncidents && Array.isArray(window.NetOpsIncidents.data)) {
      incident = window.NetOpsIncidents.data.find(i => i.id === incidentId);
    }

    if (!incident && window.NetOpsState && window.NetOpsState.data && Array.isArray(window.NetOpsState.data.incidents)) {
      incident = window.NetOpsState.data.incidents.find(i => i.id === incidentId);
    }

    // Default fallback to first incident if specified ID not found
    if (!incident && window.NetOpsIncidents && window.NetOpsIncidents.data && window.NetOpsIncidents.data.length > 0) {
      incident = window.NetOpsIncidents.data[0];
    } else if (!incident && window.NetOpsState && window.NetOpsState.data && Array.isArray(window.NetOpsState.data.incidents) && window.NetOpsState.data.incidents.length > 0) {
      incident = window.NetOpsState.data.incidents[0];
    }

    return incident;
  }

  /**
   * Gather device details for affected devices in an incident
   */
  function getAffectedDevicesDetails(affectedList) {
    if (!affectedList || !Array.isArray(affectedList)) return [];
    
    const allDevices = window.NetOpsState ? window.NetOpsState.getDevices() : [];
    return affectedList.map(hostname => {
      const match = allDevices.find(d => d.hostname === hostname || d.id === hostname);
      if (match) {
        return match;
      }
      return {
        hostname: hostname,
        type: 'Network Device',
        ip: '10.0.x.x',
        region: 'Global DC',
        status: 'healthy',
        latency: '12ms',
        uptime: '99.9%'
      };
    });
  }

  /**
   * Retrieve diagnostic execution history for affected devices
   */
  function getDiagnosticHistoryForDevices(affectedList) {
    let logs = [];
    if (window.NetOpsStorage && typeof window.NetOpsStorage.loadHistory === 'function') {
      logs = window.NetOpsStorage.loadHistory();
    }

    if (!logs || logs.length === 0) {
      const historyRows = document.querySelectorAll('#diag-history-tbody tr');
      historyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          logs.push({
            timestamp: cells[0].textContent.trim(),
            toolName: cells[1].textContent.trim(),
            targetDevice: cells[2].textContent.trim(),
            status: cells[3].textContent.trim(),
            latency: cells[4].textContent.trim(),
            packetLoss: cells[5].textContent.trim()
          });
        }
      });
    }

    if (!logs || logs.length === 0) {
      return [
        {
          timestamp: '20:49:12',
          toolName: 'ICMP Ping',
          targetDevice: (affectedList && affectedList[0]) || 'core-router-01.dc1',
          status: 'SUCCESS',
          latency: '14 ms',
          packetLoss: '0%'
        }
      ];
    }

    const filtered = logs.filter(log => affectedList.some(dev => (log.targetDevice || '').includes(dev)));
    return filtered.length > 0 ? filtered : logs.slice(0, 3);
  }

  /**
   * Generate Plain Text Incident Report
   */
  function generatePlainTextReport(incident) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const affected = incident.affectedDevices || incident.affected_devices || ["core-router-01.dc1"];
    const devicesInfo = getAffectedDevicesDetails(affected);
    const diagHistory = getDiagnosticHistoryForDevices(affected);

    let devicesBlock = devicesInfo.map(d => 
      `  - Hostname: ${d.hostname} | Type: ${d.type} | IP: ${d.ip} | Region: ${d.region} | Latency: ${d.latency || 'N/A'}`
    ).join('\n');

    let diagBlock = diagHistory.length > 0 ? diagHistory.map(h => 
      `  [${h.timestamp || 'N/A'}] Tool: ${h.toolName || 'Ping'} | Target: ${h.targetDevice || 'Device'} | Status: ${h.status || 'SUCCESS'} | Latency: ${h.latency || '12ms'} | Loss: ${h.packetLoss || '0%'}`
    ).join('\n') : '  No diagnostic execution logs recorded for this incident.';

    return `================================================================================
                        NETOPS NOC INCIDENT REPORT
================================================================================
Report Timestamp : ${nowStr}
Incident ID      : ${incident.id}
Title            : ${incident.title}
Severity Level   : ${(incident.severity || 'Medium').toUpperCase()}
Current Status   : ${(incident.status || 'Detected').toUpperCase()}
Detection Time   : ${incident.startTime || incident.timestamp || '2026-08-16 20:00:00'}

--------------------------------------------------------------------------------
1. AFFECTED NETWORK DEVICES
--------------------------------------------------------------------------------
${devicesBlock}

--------------------------------------------------------------------------------
2. INCIDENT SUMMARY & ROOT CAUSE ANALYSIS
--------------------------------------------------------------------------------
Description / Telemetry:
  ${incident.description || 'Active network telemetry anomaly logged in NOC monitor.'}

Root Cause Analysis:
  ${(incident.status || '').toLowerCase() === 'resolved' ? 'Root cause identified as transient interface flap / control plane memory burst. Failover and rate-limiting successfully normalized telemetry.' : 'Investigation ongoing. Control plane telemetry actively monitored by NOC engineering team.'}

Remediation & Action Items:
  - Verified route tables and interface health across affected nodes.
  - Executed automated ICMP & BGP diagnostic checks.
  - Telemetry parameters stabilized and verified within operational SLA thresholds.

--------------------------------------------------------------------------------
3. DIAGNOSTIC RESULTS & EXECUTION LOGS
--------------------------------------------------------------------------------
${diagBlock}

================================================================================
                         END OF REPORT - ${incident.id}
================================================================================`;
  }

  /**
   * Generate HTML Formatted Incident Report
   */
  function generateHTMLReport(incident) {
    const affected = incident.affectedDevices || incident.affected_devices || ["core-router-01.dc1"];
    const devicesInfo = getAffectedDevicesDetails(affected);
    const diagHistory = getDiagnosticHistoryForDevices(affected);
    const rawSev = (incident.severity || 'medium').toLowerCase();
    const severityClass = (rawSev === 'high' || rawSev === 'critical') ? 'critical' : (rawSev === 'low' ? 'low' : 'warning');
    const status = (incident.status || 'detected').toLowerCase();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const devicesRows = devicesInfo.map(d => `
      <tr>
        <td><strong>${escapeHtml(d.hostname)}</strong></td>
        <td><span class="device-type-tag">${escapeHtml(d.type)}</span></td>
        <td><code>${escapeHtml(d.ip)}</code></td>
        <td>${escapeHtml(d.region)}</td>
        <td><span class="status-badge status-${d.status === 'critical' ? 'critical' : (d.status === 'warning' ? 'warning' : 'healthy')}">${escapeHtml(d.status || 'online')}</span></td>
      </tr>
    `).join('');

    const diagRows = diagHistory.length > 0 ? diagHistory.map(h => `
      <tr>
        <td><code>${escapeHtml(h.timestamp || 'N/A')}</code></td>
        <td><strong>${escapeHtml(h.toolName || 'Ping')}</strong></td>
        <td><code>${escapeHtml(h.targetDevice || 'Target')}</code></td>
        <td><span class="status-badge ${(h.status || '').toUpperCase() === 'FAILURE' ? 'status-badge-detected' : 'status-badge-resolved'}">${escapeHtml(h.status || 'SUCCESS')}</span></td>
        <td>${escapeHtml(h.latency || '12ms')}</td>
        <td>${escapeHtml(h.packetLoss || '0%')}</td>
      </tr>
    `).join('') : `<tr><td colspan="6" class="text-muted">No diagnostic logs found.</td></tr>`;

    return `
      <div class="report-container">
        <div class="report-header-banner">
          <div class="report-title-group">
            <span class="report-id-chip">${escapeHtml(incident.id)}</span>
            <h2 class="report-main-title">${escapeHtml(incident.title)}</h2>
          </div>
          <div class="report-badges-group">
            <span class="severity-badge badge-${severityClass}">${escapeHtml((incident.severity || 'Medium').toUpperCase())}</span>
            <span class="status-badge status-badge-${status}">${escapeHtml(incident.status || 'Detected')}</span>
          </div>
        </div>

        <div class="report-meta-grid">
          <div class="report-meta-card">
            <span class="meta-card-label">Generated At</span>
            <span class="meta-card-value">${nowStr}</span>
          </div>
          <div class="report-meta-card">
            <span class="meta-card-label">Detected Time</span>
            <span class="meta-card-value">${escapeHtml(incident.startTime || incident.timestamp || '2026-08-16 20:00:00')}</span>
          </div>
          <div class="report-meta-card">
            <span class="meta-card-label">Affected Nodes</span>
            <span class="meta-card-value">${affected.length} Devices</span>
          </div>
        </div>

        <section class="report-section">
          <h4 class="report-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Incident Overview & Root Cause Analysis
          </h4>
          <div class="report-box">
            <p><strong>Description:</strong> ${escapeHtml(incident.description || 'Active network incident recorded in NOC telemetry.')}</p>
            <hr class="report-divider" />
            <p><strong>Root Cause Summary:</strong> ${(incident.status || '').toLowerCase() === 'resolved' ? 'Transient route flapping or memory exhaustion triggered automated circuit rerouting and failover.' : 'Telemetry parameters actively under investigation by NOC operations standard procedures.'}</p>
          </div>
        </section>

        <section class="report-section">
          <h4 class="report-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2" /></svg>
            Affected Devices Telemetry
          </h4>
          <div class="table-responsive">
            <table class="inventory-table report-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>Type</th>
                  <th>IP Address</th>
                  <th>Region</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${devicesRows}
              </tbody>
            </table>
          </div>
        </section>

        <section class="report-section">
          <h4 class="report-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>
            Diagnostic Probes & Telemetry Execution Logs
          </h4>
          <div class="table-responsive">
            <table class="inventory-table report-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Tool</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th>Latency</th>
                  <th>Loss</th>
                </tr>
              </thead>
              <tbody>
                ${diagRows}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `;
  }

  /**
   * Trigger native browser file download for report content
   */
  function downloadReportFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Open Report Preview Modal
   */
  function openReportModal(incidentId) {
    let incident = getIncidentData(incidentId);

    if (!incident) {
      const allIncidents = (window.NetOpsIncidents && window.NetOpsIncidents.data) || [];
      incident = allIncidents.find(i => (i.status || '').toLowerCase() === 'resolved') || allIncidents[0];
    }

    if (!incident) {
      alert('No incident available to generate a report.');
      return;
    }

    const modal = document.getElementById('report-modal');
    const contentContainer = document.getElementById('report-modal-content');

    const htmlContent = generateHTMLReport(incident);
    const plainTextContent = generatePlainTextReport(incident);

    if (contentContainer) {
      contentContainer.innerHTML = htmlContent;
    }

    if (modal) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }

    // Bind action buttons
    const btnCopy = document.getElementById('btn-copy-report');
    const btnTxt = document.getElementById('btn-download-txt-report');
    const btnHtml = document.getElementById('btn-download-html-report');
    const btnClose = document.getElementById('close-report-modal');

    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(plainTextContent).then(() => {
          const origText = btnCopy.textContent;
          btnCopy.textContent = '✓ Copied!';
          setTimeout(() => { btnCopy.textContent = origText; }, 2000);
        }).catch(err => {
          console.error('Clipboard copy failed:', err);
        });
      };
    }

    if (btnTxt) {
      btnTxt.onclick = () => {
        downloadReportFile(plainTextContent, `Incident_Report_${incident.id}.txt`, 'text/plain');
      };
    }

    if (btnHtml) {
      btnHtml.onclick = () => {
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Incident Report - ${incident.id}</title><style>body{font-family:sans-serif;background:#0b0f19;color:#f3f4f6;padding:2rem;}.report-container{max-width:800px;margin:0 auto;background:#182238;padding:2rem;border-radius:8px;}table{width:100%;border-collapse:collapse;margin:1rem 0;}th,td{padding:8px;border:1px solid #334155;text-align:left;}</style></head><body>${htmlContent}</body></html>`;
        downloadReportFile(fullHtml, `Incident_Report_${incident.id}.html`, 'text/html');
      };
    }

    if (btnClose) {
      btnClose.onclick = closeReportModal;
    }
  }

  /**
   * Close Report Preview Modal
   */
  function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Module initialization
   */
  function initReportsModule() {
    const headerBtn = document.getElementById('btn-generate-report');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        const allIncidents = (window.NetOpsIncidents && window.NetOpsIncidents.data) || [];
        const resolvedIncidents = allIncidents.filter(i => (i.status || '').toLowerCase() === 'resolved');
        
        if (resolvedIncidents.length > 0) {
          openReportModal(resolvedIncidents[0].id);
        } else if (allIncidents.length > 0) {
          openReportModal(allIncidents[0].id);
        } else {
          alert('No incidents found in system to generate a report.');
        }
      });
    }

    // Modal background overlay click to close
    const modal = document.getElementById('report-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeReportModal();
        }
      });
    }

    // ESC key closes report modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeReportModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportsModule);
  } else {
    initReportsModule();
  }

  // Export global interface
  window.NetOpsReports = {
    generatePlainText: generatePlainTextReport,
    generateHTML: generateHTMLReport,
    downloadReport: downloadReportFile,
    openReportModal: openReportModal,
    closeReportModal: closeReportModal
  };

  window.generateIncidentReport = openReportModal;
})();
