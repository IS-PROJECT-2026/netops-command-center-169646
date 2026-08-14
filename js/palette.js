/**
 * Keyboard Accessible Command Palette for NetOps Command Center
 * Triggered via Ctrl+K / Cmd+K keyboard shortcuts or header search trigger.
 */

(function () {
  'use strict';

  // Navigation Helper
  function navigateToSection(targetId, targetTitle) {
    const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (activeLink) {
      activeLink.click();
    } else {
      const pageSections = document.querySelectorAll('.page-section');
      pageSections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
      });
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
      }
      const titleEl = document.getElementById('current-view-title');
      if (titleEl && targetTitle) titleEl.textContent = targetTitle;
    }
  }

  // Diagnostic Action Helper
  function runDiagTool(toolName) {
    navigateToSection('section-diagnostics', 'Network Diagnostics');
    setTimeout(() => {
      const btn = document.querySelector(`.btn-diag-tool[data-tool="${toolName}"]`);
      if (btn) btn.click();
    }, 150);
  }

  // Command Registry
  const COMMANDS = [
    {
      id: 'cmd-dashboard',
      title: 'Go to Dashboard Overview',
      category: 'Navigation',
      shortcut: 'G D',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
      action: () => navigateToSection('section-dashboard', 'Dashboard Overview')
    },
    {
      id: 'cmd-devices',
      title: 'View Device Inventory',
      category: 'Navigation',
      shortcut: 'G I',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>',
      action: () => navigateToSection('section-devices', 'Device Inventory')
    },
    {
      id: 'cmd-topology',
      title: 'View Network Topology Map',
      category: 'Navigation',
      shortcut: 'G T',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>',
      action: () => navigateToSection('section-topology', 'Network Topology')
    },
    {
      id: 'cmd-incidents',
      title: 'View Incident Management',
      category: 'Navigation',
      shortcut: 'G M',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
      action: () => navigateToSection('section-incidents', 'Incident Management')
    },
    {
      id: 'cmd-diagnostics',
      title: 'View Network Diagnostics',
      category: 'Navigation',
      shortcut: 'G N',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>',
      action: () => navigateToSection('section-diagnostics', 'Network Diagnostics')
    },
    {
      id: 'cmd-theme',
      title: 'Toggle Dark / Light Theme',
      category: 'Preferences',
      shortcut: 'T T',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>',
      action: () => {
        if (window.NetOpsTheme) window.NetOpsTheme.toggleTheme();
      }
    },
    {
      id: 'cmd-generate-report',
      title: 'Generate Incident Report',
      category: 'Actions',
      shortcut: 'G R',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      action: () => {
        if (window.NetOpsReports) window.NetOpsReports.openReportModal();
      }
    },
    {
      id: 'cmd-create-incident',
      title: 'Report New Incident',
      category: 'Actions',
      shortcut: 'N I',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>',
      action: () => {
        navigateToSection('section-incidents', 'Incident Management');
        setTimeout(() => {
          const btn = document.getElementById('btn-create-incident');
          if (btn) btn.click();
        }, 150);
      }
    },
    {
      id: 'cmd-ping',
      title: 'Run Diagnostic Probe: ICMP Ping',
      category: 'Diagnostics',
      shortcut: 'R P',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
      action: () => runDiagTool('Ping')
    },
    {
      id: 'cmd-traceroute',
      title: 'Run Diagnostic Probe: Traceroute',
      category: 'Diagnostics',
      shortcut: 'R T',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.818V8.052a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>',
      action: () => runDiagTool('Traceroute')
    },
    {
      id: 'cmd-dns',
      title: 'Run Diagnostic Probe: DNS Lookup',
      category: 'Diagnostics',
      shortcut: 'R D',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>',
      action: () => runDiagTool('DNS Lookup')
    },
    {
      id: 'cmd-port-scan',
      title: 'Run Diagnostic Probe: Port Scanner',
      category: 'Diagnostics',
      shortcut: 'R S',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
      action: () => runDiagTool('Port Scan')
    }
  ];

  let isOpen = false;
  let selectedIndex = 0;
  let currentFilteredCommands = [...COMMANDS];

  /**
   * Helper to escape HTML characters
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
   * Filter command list based on search term
   */
  function filterCommands(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      currentFilteredCommands = [...COMMANDS];
    } else {
      currentFilteredCommands = COMMANDS.filter(cmd => 
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
      );
    }
    selectedIndex = 0;
    renderResults();
  }

  /**
   * Render filtered commands into the results list UI
   */
  function renderResults() {
    const resultsList = document.getElementById('palette-results-list');
    if (!resultsList) return;

    if (currentFilteredCommands.length === 0) {
      resultsList.innerHTML = `
        <li class="palette-empty-state">
          <p>No matching commands found</p>
        </li>
      `;
      return;
    }

    resultsList.innerHTML = currentFilteredCommands.map((cmd, idx) => {
      const isSelected = idx === selectedIndex;
      return `
        <li class="palette-item ${isSelected ? 'selected' : ''}" 
            role="option" 
            id="palette-opt-${cmd.id}" 
            aria-selected="${isSelected}"
            data-index="${idx}">
          <div class="palette-item-left">
            <span class="palette-item-icon">${cmd.icon}</span>
            <span class="palette-item-title">${escapeHtml(cmd.title)}</span>
          </div>
          <div class="palette-item-right">
            <span class="palette-item-category">${escapeHtml(cmd.category)}</span>
            ${cmd.shortcut ? `<kbd class="palette-shortcut">${escapeHtml(cmd.shortcut)}</kbd>` : ''}
          </div>
        </li>
      `;
    }).join('');

    // Scroll active item into view if necessary
    const activeEl = resultsList.querySelector('.palette-item.selected');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }

    // Attach click handlers to rendered items
    resultsList.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        executeCommand(idx);
      });
      item.addEventListener('mouseenter', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        selectedIndex = idx;
        updateSelectedHighlight();
      });
    });
  }

  /**
   * Update selection highlight classes without full re-render
   */
  function updateSelectedHighlight() {
    const items = document.querySelectorAll('#palette-results-list .palette-item');
    items.forEach((item, idx) => {
      const isSelected = idx === selectedIndex;
      item.classList.toggle('selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  /**
   * Execute selected command action and close palette
   */
  function executeCommand(index) {
    const cmd = currentFilteredCommands[index];
    if (cmd && typeof cmd.action === 'function') {
      closePalette();
      cmd.action();
    }
  }

  /**
   * Open Command Palette
   */
  function openPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('palette-search-input');

    if (!modal) return;

    isOpen = true;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    if (input) {
      input.value = '';
      filterCommands('');
      setTimeout(() => input.focus(), 50);
    }
  }

  /**
   * Close Command Palette
   */
  function closePalette() {
    const modal = document.getElementById('command-palette-modal');
    if (!modal) return;

    isOpen = false;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Toggle Command Palette visibility
   */
  function togglePalette() {
    if (isOpen) {
      closePalette();
    } else {
      openPalette();
    }
  }

  /**
   * Global Keyboard Shortcuts Listener
   */
  function handleKeyDown(e) {
    // Ctrl+K or Cmd+K to toggle Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentFilteredCommands.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentFilteredCommands.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentFilteredCommands.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentFilteredCommands.length) % currentFilteredCommands.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFilteredCommands.length > 0) {
        executeCommand(selectedIndex);
      }
    }
  }

  /**
   * Initialize Command Palette Module
   */
  function initPaletteModule() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('palette-search-input');
    const triggerBtn = document.getElementById('cmd-palette-trigger');

    if (input) {
      input.addEventListener('input', (e) => {
        filterCommands(e.target.value);
      });
    }

    if (triggerBtn) {
      triggerBtn.addEventListener('click', openPalette);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closePalette();
        }
      });
    }

    window.addEventListener('keydown', handleKeyDown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaletteModule);
  } else {
    initPaletteModule();
  }

  // Export Global Interface
  window.NetOpsPalette = {
    open: openPalette,
    close: closePalette,
    toggle: togglePalette
  };
})();
