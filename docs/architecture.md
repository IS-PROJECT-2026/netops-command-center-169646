# NetOps Command Center Architecture

## Major Modules
1. **Dashboard:** Overall network health and metrics.
2. **Device Inventory:** Table-based view of all network nodes.
3. **Topology:** Interactive visual map of connections.
4. **Incidents:** Lifecycle management for simulated outages.
5. **Diagnostics:** Tools for ping, DNS, and gateway analysis.

## State Management
Application state will be managed via vanilla JavaScript objects and persisted using `localStorage`.

## Navigation
Single-page application (SPA) style navigation without page reloads.
