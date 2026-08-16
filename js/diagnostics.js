/**
 * Network Diagnostics Engine & UI Controller for NetOps Command Center
 */

/**
 * Generic simulation engine function runDiagnostic
 * @param {string} toolName - Tool name (e.g. "Ping", "Traceroute", "DNS Lookup", "Port Scan", etc.)
 * @param {string} targetDevice - Target device IP or Hostname
 * @returns {Promise<Object>} Result object with simulated latency and packet loss data
 */
async function runDiagnostic(toolName, targetDevice) {
  const target = targetDevice || "core-router-01.dc1";
  const tool = toolName || "Ping";

  // Simulate 1.5-second realistic probe delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Determine success based on target device status if known
  let isSuccess = Math.random() > 0.15;
  if (window.NetOpsState) {
    const devices = window.NetOpsState.getDevices();
    const match = devices.find(d => d.hostname === target || d.ip === target);
    if (match) {
      if (match.status === 'critical') isSuccess = Math.random() > 0.8;
      else if (match.status === 'warning') isSuccess = Math.random() > 0.4;
      else isSuccess = Math.random() > 0.05;
    }
  }

  const baseLatency = Math.floor(Math.random() * 25 + 5);
  const minLatency = Math.max(1, baseLatency - Math.floor(Math.random() * 5));
  const maxLatency = baseLatency + Math.floor(Math.random() * 30);
  const avgLatencyStr = `${baseLatency} ms`;
  const packetLossStr = isSuccess ? "0%" : "25%";

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logs = [];

  // Generate realistic simulated command CLI output based on toolName
  const toolLower = tool.toLowerCase();

  if (toolLower.includes('ping')) {
    logs.push(`PING ${target} (${target}) 56(84) bytes of data.`);
    if (isSuccess) {
      logs.push(`64 bytes from ${target}: icmp_seq=1 ttl=64 time=${minLatency}.12 ms`);
      logs.push(`64 bytes from ${target}: icmp_seq=2 ttl=64 time=${baseLatency}.45 ms`);
      logs.push(`64 bytes from ${target}: icmp_seq=3 ttl=64 time=${baseLatency + 2}.02 ms`);
      logs.push(`64 bytes from ${target}: icmp_seq=4 ttl=64 time=${maxLatency}.89 ms`);
      logs.push(`--- ${target} ping statistics ---`);
      logs.push(`4 packets transmitted, 4 received, 0% packet loss, time 3004ms`);
      logs.push(`rtt min/avg/max/mdev = ${minLatency}.12/${baseLatency}.45/${maxLatency}.89/2.11 ms`);
    } else {
      logs.push(`64 bytes from ${target}: icmp_seq=1 ttl=64 time=${baseLatency}.30 ms`);
      logs.push(`Request timeout for icmp_seq 2`);
      logs.push(`Request timeout for icmp_seq 3`);
      logs.push(`64 bytes from ${target}: icmp_seq=4 ttl=64 time=${maxLatency}.50 ms`);
      logs.push(`--- ${target} ping statistics ---`);
      logs.push(`4 packets transmitted, 2 received, 50% packet loss, time 4010ms`);
    }
  } else if (toolLower.includes('traceroute')) {
    logs.push(`traceroute to ${target} (${target}), 30 hops max, 60 byte packets`);
    logs.push(` 1  gateway.internal (10.0.0.1)  0.842 ms  0.712 ms  0.690 ms`);
    logs.push(` 2  core-switch-01.dc1 (10.0.1.5)  3.120 ms  2.990 ms  3.010 ms`);
    if (isSuccess) {
      logs.push(` 3  bb-transit-east.net (192.168.10.1)  12.450 ms  12.310 ms  12.400 ms`);
      logs.push(` 4  ${target} (${target})  ${baseLatency}.150 ms  ${baseLatency}.020 ms  ${baseLatency}.110 ms`);
      logs.push(`Trace complete. All hops responding cleanly.`);
    } else {
      logs.push(` 3  bb-transit-east.net (192.168.10.1)  14.200 ms  14.100 ms  14.150 ms`);
      logs.push(` 4  * * * Request timed out.`);
      logs.push(` 5  * * * Destination Host Unreachable.`);
    }
  } else if (toolLower.includes('dns')) {
    logs.push(`; <<>> DiG 9.18.1-1-Debian <<>> ${target} A +stats`);
    logs.push(`;; global options: +cmd`);
    logs.push(`;; Got answer:`);
    if (isSuccess) {
      logs.push(`;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 60000)}`);
      logs.push(`;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1`);
      logs.push(`;; QUESTION SECTION:`);
      logs.push(`;${target}. IN A`);
      logs.push(`;; ANSWER SECTION:`);
      logs.push(`${target}. 300 IN A 10.0.1.1`);
      logs.push(`${target}. 300 IN A 10.0.1.2`);
      logs.push(`;; Query time: ${baseLatency} msec`);
      logs.push(`;; SERVER: 1.1.1.1#53(1.1.1.1)`);
    } else {
      logs.push(`;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 41209`);
      logs.push(`;; Query time: ${maxLatency} msec`);
      logs.push(`;; SERVER: 1.1.1.1#53(1.1.1.1) - CONNECTION TIMEOUT`);
    }
  } else if (toolLower.includes('port')) {
    logs.push(`Starting Nmap 7.94 ( https://nmap.org ) at ${timestamp}`);
    logs.push(`Nmap scan report for ${target}`);
    logs.push(`Host is up (${baseLatency}ms latency).`);
    logs.push(`PORT     STATE    SERVICE`);
    logs.push(`22/tcp   open     ssh`);
    logs.push(`80/tcp   open     http`);
    logs.push(`443/tcp  open     https`);
    logs.push(`161/udp  ${isSuccess ? 'open' : 'filtered'}  snmp`);
    logs.push(`179/tcp  ${isSuccess ? 'open' : 'closed'}    bgp`);
    logs.push(`Nmap done: 1 IP address scanned in 1.50 seconds.`);
  } else {
    logs.push(`[${timestamp}] Initiating ${tool} test engine for target ${target}...`);
    logs.push(`Opening probe channel across control plane...`);
    if (isSuccess) {
      logs.push(`[SUCCESS] Probe completed successfully. Average latency: ${avgLatencyStr}, Packet Loss: ${packetLossStr}`);
      logs.push(`All system diagnostic checks returned status OK.`);
    } else {
      logs.push(`[FAILURE] Diagnostic probe detected anomaly. Average latency: ${avgLatencyStr}, Packet Loss: ${packetLossStr}`);
      logs.push(`Error: Packet drop rate exceeded SLA threshold.`);
    }
  }

  return {
    toolName: tool,
    targetDevice: target,
    timestamp: timestamp,
    success: isSuccess,
    status: isSuccess ? "SUCCESS" : "FAILURE",
    latency: avgLatencyStr,
    minLatency: `${minLatency} ms`,
    maxLatency: `${maxLatency} ms`,
    packetLoss: packetLossStr,
    output: logs.join('\n')
  };
}

// UI Module Controller
(function () {
  'use strict';

  let isRunning = false;

  function populateTargetSelect() {
    const select = document.getElementById('diag-target-select');
    if (!select) return;

    if (window.NetOpsState) {
      const devices = window.NetOpsState.getDevices();
      select.innerHTML = devices.map(d => `
        <option value="${d.hostname}">${d.hostname} (${d.ip}) - [${d.type}]</option>
      `).join('') + `<option value="custom">Custom Target IP / Hostname...</option>`;
    }
  }

  async function handleDiagnosticRun(toolName) {
    if (isRunning) return;

    const select = document.getElementById('diag-target-select');
    const customInput = document.getElementById('diag-custom-target');
    let target = select ? select.value : 'core-router-01.dc1';

    if (target === 'custom' && customInput) {
      target = customInput.value.trim() || '10.0.1.1';
    }

    const consoleOutput = document.getElementById('diag-console-output');
    const statusBadge = document.getElementById('diag-status-badge');
    const activeToolTitle = document.getElementById('diag-active-tool');
    const activeTargetTitle = document.getElementById('diag-active-target');
    const toolButtons = document.querySelectorAll('.btn-diag-tool');

    isRunning = true;
    toolButtons.forEach(b => b.disabled = true);

    if (activeToolTitle) activeToolTitle.textContent = toolName;
    if (activeTargetTitle) activeTargetTitle.textContent = target;

    if (statusBadge) {
      statusBadge.className = 'status-badge status-badge-running';
      statusBadge.innerHTML = `<span class="pulse-dot"></span> RUNNING...`;
    }

    if (consoleOutput) {
      consoleOutput.textContent = `[${new Date().toLocaleTimeString()}] Running ${toolName} diagnostic probe against ${target}...\n` +
                                 `Simulating network round-trip probe...\n` +
                                 `Awaiting response payload...`;
    }

    try {
      const result = await runDiagnostic(toolName, target);

      if (statusBadge) {
        if (result.success) {
          statusBadge.className = 'status-badge status-badge-resolved';
          statusBadge.textContent = `✓ SUCCESS (${result.latency})`;
        } else {
          statusBadge.className = 'status-badge status-badge-detected';
          statusBadge.textContent = `⚠ FAILED (${result.packetLoss} loss)`;
        }
      }

      if (consoleOutput) {
        consoleOutput.textContent = result.output;
      }

      appendHistoryRow(result);

      // Save to storage
      if (window.NetOpsStorage) {
        window.NetOpsStorage.addHistoryEntry(result);
      }

      // Update RCA scoring in real-time
      if (window.NetOpsRCA && typeof window.NetOpsRCA.render === 'function') {
        const fullHistory = (window.NetOpsStorage && window.NetOpsStorage.loadHistory()) || [];
        window.NetOpsRCA.render(fullHistory);
      }

    } catch (err) {
      console.error("Diagnostic execution error:", err);
      if (consoleOutput) consoleOutput.textContent = `[ERROR] Execution failed: ${err.message}`;
    } finally {
      isRunning = false;
      toolButtons.forEach(b => b.disabled = false);
    }
  }

  function appendHistoryRow(result) {
    const tbody = document.getElementById('diag-history-tbody');
    if (!tbody) return;

    const timePart = (result.timestamp || '').includes(' ') ? result.timestamp.split(' ')[1] : result.timestamp;

    const tr = document.createElement('tr');
    tr.className = result.success ? 'row-success' : 'row-failure';
    tr.innerHTML = `
      <td><code class="code-tag">${timePart || 'N/A'}</code></td>
      <td><strong>${result.toolName}</strong></td>
      <td><code>${result.targetDevice}</code></td>
      <td><span class="status-badge ${result.success ? 'status-badge-resolved' : 'status-badge-detected'}">${result.status}</span></td>
      <td>${result.latency}</td>
      <td>${result.packetLoss}</td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);
    if (tbody.children.length > 10) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  function initDiagnosticsModule() {
    populateTargetSelect();

    const select = document.getElementById('diag-target-select');
    const customInput = document.getElementById('diag-custom-target');

    if (select) {
      select.addEventListener('change', () => {
        if (select.value === 'custom' && customInput) {
          customInput.classList.remove('hidden');
          customInput.focus();
        } else if (customInput) {
          customInput.classList.add('hidden');
        }
      });
    }

    const toolButtons = document.querySelectorAll('.btn-diag-tool');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const toolName = btn.getAttribute('data-tool') || btn.textContent.trim();
        handleDiagnosticRun(toolName);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiagnosticsModule);
  } else {
    initDiagnosticsModule();
  }

  window.runDiagnostic = runDiagnostic;
  window.NetOpsDiagnostics = {
    run: runDiagnostic,
    handleRun: handleDiagnosticRun
  };
})();
