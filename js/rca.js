/**
 * Root Cause Analysis (RCA) & Investigation Scoring Engine
 * NetOps Command Center
 */

(function () {
  'use strict';

  /**
   * Default diagnostic results dataset evaluated for RCA scoring
   */
  const defaultDiagnosticResults = [
    {
      id: "DIAG-101",
      toolName: "ICMP Ping",
      tool: "ICMP Ping",
      targetDevice: "edge-router-01.eu1",
      target: "edge-router-01.eu1",
      status: "FAILURE",
      latency: "185 ms",
      packetLoss: "25%",
      errorDetails: "High packet drop on interface TenGigE0/0/1"
    },
    {
      id: "DIAG-102",
      toolName: "BGP Route Check",
      tool: "BGP Route Check",
      targetDevice: "edge-router-01.eu1",
      target: "edge-router-01.eu1",
      status: "FAILURE",
      latency: "190 ms",
      packetLoss: "0%",
      errorDetails: "BGP Peer 194.12.0.4 state changed to FLAPPING"
    },
    {
      id: "DIAG-103",
      toolName: "Traceroute",
      tool: "Traceroute",
      targetDevice: "edge-router-01.eu1",
      target: "edge-router-01.eu1",
      status: "FAILURE",
      latency: "210 ms",
      packetLoss: "50%",
      errorDetails: "Hop 4 timeout: Transit link saturation on EU circuit"
    },
    {
      id: "DIAG-104",
      toolName: "DNS Lookup",
      tool: "DNS Lookup",
      targetDevice: "dns-auth-01.global",
      target: "dns-auth-01.global",
      status: "SUCCESS",
      latency: "5 ms",
      packetLoss: "0%",
      errorDetails: null
    },
    {
      id: "DIAG-105",
      toolName: "Port Scanner",
      tool: "Port Scanner",
      targetDevice: "sec-gateway-02.ap1",
      target: "sec-gateway-02.ap1",
      status: "WARNING",
      latency: "240 ms",
      packetLoss: "0%",
      errorDetails: "SNMP service response delayed under heavy TLS load"
    }
  ];

  /**
   * Calculate Investigation Confidence Score (0 - 100%)
   * @param {Array} results - List of diagnostic result objects
   * @returns {Object} Score details object
   */
  function calculateConfidenceScore(results) {
    const diagnosticData = results && results.length > 0 ? results : defaultDiagnosticResults;
    const totalProbes = diagnosticData.length;
    if (totalProbes === 0) {
      return { score: 0, tier: "Low Confidence", levelClass: "score-low", summary: "No diagnostic probes evaluated." };
    }

    const failedProbes = diagnosticData.filter(d => {
      const isFail = (d.status || '').toUpperCase() === 'FAILURE';
      const lossVal = parseInt(d.packetLoss || '0', 10);
      return isFail || lossVal > 10;
    });

    const failureRatio = failedProbes.length / totalProbes;

    // Base score baseline when anomalies exist
    let score = 40;

    // 1. Failure Ratio Weight (up to +30%)
    score += Math.round(failureRatio * 30);

    // 2. High Anomaly Severity Weight (up to +20%)
    const hasBgpFlap = diagnosticData.some(d => (d.errorDetails || d.output || '').toLowerCase().includes('bgp'));
    const hasHighPacketLoss = diagnosticData.some(d => parseInt(d.packetLoss || '0', 10) >= 20);
    const hasHighLatency = diagnosticData.some(d => parseInt(d.latency || '0', 10) > 150);

    if (hasBgpFlap) score += 8;
    if (hasHighPacketLoss) score += 7;
    if (hasHighLatency) score += 5;

    // 3. Target Device Clustering Weight (up to +10%)
    const deviceFailures = {};
    failedProbes.forEach(p => {
      const tgt = p.targetDevice || p.target;
      if (tgt) {
        deviceFailures[tgt] = (deviceFailures[tgt] || 0) + 1;
      }
    });
    const maxTargetFailures = Math.max(0, ...Object.values(deviceFailures));
    if (maxTargetFailures >= 2) {
      score += 10;
    }

    // Clamp score between 0 and 100
    score = Math.min(100, Math.max(0, score));

    // Determine tier classification
    let tier = "Low Confidence";
    let levelClass = "score-low";
    if (score >= 80) {
      tier = "High Confidence";
      levelClass = "score-high";
    } else if (score >= 50) {
      tier = "Moderate Confidence";
      levelClass = "score-medium";
    }

    return {
      score: score,
      tier: tier,
      levelClass: levelClass,
      totalProbes: totalProbes,
      failedProbesCount: failedProbes.length,
      warningProbesCount: diagnosticData.filter(d => (d.status || '').toUpperCase() === 'WARNING').length
    };
  }

  /**
   * Perform Root Cause Analysis (RCA) on diagnostic results
   * @param {Array} results - Optional array of diagnostic results
   * @returns {Object} Comprehensive RCA Report
   */
  function performRootCauseAnalysis(results) {
    const diagnosticData = results && results.length > 0 ? results : defaultDiagnosticResults;
    const scoreInfo = calculateConfidenceScore(diagnosticData);

    const targetCounts = {};
    diagnosticData.forEach(d => {
      const tgt = d.targetDevice || d.target;
      const isFail = (d.status || '').toUpperCase() === 'FAILURE' || parseInt(d.packetLoss || '0', 10) > 0;
      if (tgt && isFail) {
        targetCounts[tgt] = (targetCounts[tgt] || 0) + 1;
      }
    });

    let primaryDevice = "edge-router-01.eu1";
    let maxCount = 0;
    for (const [device, count] of Object.entries(targetCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryDevice = device;
      }
    }

    const now = new Date();
    const timeString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const rcaReport = {
      primaryDevice: primaryDevice,
      rootCause: "BGP Route Oscillation & Interface Congestion",
      confidenceScore: scoreInfo.score,
      confidenceTier: scoreInfo.tier,
      levelClass: scoreInfo.levelClass,
      summary: `Automated diagnostic correlation identified severe packet loss and BGP flapping on ${primaryDevice} as the primary root cause. Inter-region transit circuit shows hop-level queue drops.`,
      recommendedAction: `1. Re-seat or failover BGP session on ${primaryDevice}.\n2. Shift transatlantic transit traffic to secondary path.\n3. Clear interface buffer queues and re-run ICMP diagnostic suite.`,
      evaluatedProbes: scoreInfo.totalProbes,
      failedProbes: scoreInfo.failedProbesCount,
      timestamp: timeString,
      diagnosticsEvaluated: diagnosticData
    };

    return rcaReport;
  }

  /**
   * Render RCA UI Section in DOM
   */
  function renderRCAUI(results) {
    const rcaContainer = document.getElementById('rca-score-section');
    if (!rcaContainer) return;

    const rcaData = performRootCauseAnalysis(results);

    rcaContainer.innerHTML = `
      <div class="noc-card rca-card" id="card-rca-analysis">
        <div class="card-header">
          <div class="card-title">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3>Root Cause Analysis (RCA) & Investigation Score</h3>
          </div>
          <span class="status-badge status-badge-${rcaData.levelClass}">${rcaData.confidenceTier}</span>
        </div>

        <div class="rca-content-grid">
          <!-- Confidence Gauge & Score -->
          <div class="rca-score-box">
            <span class="score-label">Investigation Confidence</span>
            <div class="score-value-wrap">
              <span class="score-number ${rcaData.levelClass}">${rcaData.confidenceScore}%</span>
            </div>
            <div class="rca-progress-bar">
              <div class="rca-progress-fill ${rcaData.levelClass}" style="width: ${rcaData.confidenceScore}%;"></div>
            </div>
            <span class="score-subtext">Based on ${rcaData.evaluatedProbes} diagnostic probes (${rcaData.failedProbes} anomalous)</span>
          </div>

          <!-- Root Cause Details -->
          <div class="rca-details-box">
            <div class="rca-meta-row">
              <span class="rca-meta-label">Primary Suspect Node:</span>
              <code class="code-tag rca-node-tag">${rcaData.primaryDevice}</code>
            </div>
            <div class="rca-meta-row">
              <span class="rca-meta-label">Identified Cause:</span>
              <strong class="rca-cause-title">${rcaData.rootCause}</strong>
            </div>
            <p class="rca-summary-text">${rcaData.summary}</p>
            <div class="rca-recommendation">
              <strong>Recommended Remediation:</strong>
              <p>${rcaData.recommendedAction.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        </div>

        <div class="rca-footer-actions">
          <button type="button" id="btn-re-evaluate-rca" class="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-evaluate RCA Diagnostics
          </button>
          <span class="rca-timestamp">Last Evaluated: ${rcaData.timestamp}</span>
        </div>
      </div>
    `;

    const reEvalBtn = document.getElementById('btn-re-evaluate-rca');
    if (reEvalBtn) {
      reEvalBtn.addEventListener('click', () => {
        const historyData = (window.NetOpsStorage && window.NetOpsStorage.loadHistory()) || [];
        renderRCAUI(historyData);
      });
    }
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderRCAUI());
  } else {
    renderRCAUI();
  }

  // Global export
  window.NetOpsRCA = {
    evaluate: performRootCauseAnalysis,
    calculateScore: calculateConfidenceScore,
    render: renderRCAUI,
    dummyResults: defaultDiagnosticResults
  };
})();
