/**
 * NetOps Command Center - Core Utility Helpers
 */

(function () {
  'use strict';

  const NetOpsUtils = {
    /**
     * Escape HTML entities to prevent XSS
     */
    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Format a timestamp or date string to HH:MM:SS or full UTC format
     */
    formatTime(timeStr) {
      if (!timeStr) return '--:--:--';
      if (timeStr.includes(' ')) {
        return timeStr.split(' ')[1];
      }
      if (timeStr.includes('T')) {
        return timeStr.split('T')[1].substring(0, 8);
      }
      return timeStr;
    },

    /**
     * Format device list to an array
     */
    normalizeDevicesList(devices) {
      if (!devices) return [];
      if (Array.isArray(devices)) return devices;
      if (typeof devices === 'string') return [devices];
      return [];
    },

    /**
     * Generate unique random ID with prefix
     */
    generateId(prefix = 'ID') {
      return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  };

  window.NetOpsUtils = NetOpsUtils;
})();
