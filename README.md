# NetOps Command Center

[![Live Deployment](https://img.shields.io/badge/Live_Deployment-GitHub_Pages-success?style=for-the-badge&logo=github)](https://is-project-2026.github.io/netops-command-center-169646/)
[![JavaScript](https://img.shields.io/badge/ES6+-Vanilla_JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Semantic_Markup-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Grid_%26_Flexbox-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)

> A client-side, zero-dependency Network Operations Center (NOC) simulator and real-time telemetry dashboard designed for deterministic state persistence, automated root-cause analysis (RCA), and incident response lifecycle management.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [System Architecture & Core Features](#system-architecture--core-features)
  - [1. Persistent State Management Engine](#1-persistent-state-management-engine)
  - [2. Telemetry Dashboard & Live Event Stream](#2-telemetry-dashboard--live-event-stream)
  - [3. Device Inventory & Telemetry Inspection](#3-device-inventory--telemetry-inspection)
  - [4. Dynamic Network Topology Map](#4-dynamic-network-topology-map)
  - [5. Incident Response Lifecycle Pipeline](#5-incident-response-lifecycle-pipeline)
  - [6. Network Diagnostics & Root Cause Analysis (RCA) Engine](#6-network-diagnostics--root-cause-analysis-rca-engine)
  - [7. Command Palette & Universal Keyboard Accessibility](#7-command-palette--universal-keyboard-accessibility)
  - [8. Automated Incident Post-Mortem Reporting](#8-automated-incident-post-mortem-reporting)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Local Installation & Setup](#local-installation--setup)
- [Quality Assurance & CI/CD Pipeline](#quality-assurance--cicd-pipeline)
- [Academic Declaration](#academic-declaration)

---

## Overview

The **NetOps Command Center** is an enterprise-grade Network Operations Center simulator developed natively using web standards (ES6+ Vanilla JavaScript, semantic HTML5, and modular CSS3). It delivers low-latency telemetry visualization, network anomaly triage, diagnostic probe simulation, and incident resolution tracking without external UI runtime frameworks or heavy third-party dependencies.

The system emphasizes high availability, robust client-side storage recovery, accessibility standards (ARIA, WCAG 2.1), and deterministic telemetry state synchronization.

---

## Live Demo

The production application is deployed and hosted on GitHub Pages:

**Live Deployment URL:** [https://is-project-2026.github.io/netops-command-center-169646/](https://is-project-2026.github.io/netops-command-center-169646/)

---

## System Architecture & Core Features

### 1. Persistent State Management Engine
- **Normalized Schema Handling:** Ingestion and synchronization pipelines across `localStorage` automatically normalize incident data structures (`affectedDevices`/`affected_devices`, `startTime`/`timestamp`), preventing runtime schema mismatch errors.
- **Fail-Safe Hydration:** Gracefully restores network state, custom incidents, executed diagnostic histories, and UI theme preferences across browser sessions.
- **Bidirectional Hooks:** Automatic state observation ensures mutations in the incident pipeline or diagnostics engine immediately trigger reactivity across dependent views.

### 2. Telemetry Dashboard & Live Event Stream
- **Real-Time KPI Summaries:** Dynamic calculation of system uptime, overall packet loss, average round-trip latency, total managed devices, and online health ratios.
- **Proportional Health Distribution:** Proportional visual health bars that dynamically adapt to real-time status transitions (`Operational`, `Warning`, `Degraded`).
- **Simulated Real-Time Stream:** Live ticker displaying network flaps, DDoS mitigations, BGP route adjustments, and DNS query surges with continuous animation loops.

### 3. Device Inventory & Telemetry Inspection
- **Instant Search & Multi-Tier Filter:** Multi-parameter query engine filtering by Hostname, IP address, and operational state (`All`, `Online`, `Warning`, `Offline`).
- **Slide-Out Telemetry Drawer:** Keyboard-accessible (`Enter`/`Space`/`ESC`) inspection panel detailing interface types, assigned subnets, DC regions, and live latency.
- **Contextual Action Dispatch:** Direct "Ping Device" and "Traceroute" triggers that switch views, bind the target device, and execute diagnostics in one sequence.

### 4. Dynamic Network Topology Map
- **3-Tier Network Hierarchy:** Structural categorization into **Core**, **Distribution & Security**, and **Access & Edge** tiers.
- **Vector-Based SVG Bezier Links:** Dynamic calculation and rendering of interconnect link status colored by live connection health.
- **Contextual Focus & Dimming:** Interactive hover focusing that highlights adjacent links while dimming unrelated network topology paths.

### 5. Incident Response Lifecycle Pipeline
- **Strict 4-Stage State Machine:** Explicit progression model (`Detected` -> `Investigating` -> `Mitigated` -> `Resolved`).
- **Interactive Stepper Controls:** Rapid status progression buttons paired with granular manual transition overrides.
- **Incident Ingestion:** Real-time logging of new telemetry incidents with immediate state broadcast.
- **Resolved Investigation Archive:** Archival log tracking resolved incidents alongside automated post-mortem RCA confidence scoring.

### 6. Network Diagnostics & Root Cause Analysis (RCA) Engine
- **6 Realistic Network Probes:** Simulation of ICMP Ping, Traceroute (hop-by-hop), DNS Dig Queries, Port Scanning, BGP Route Checking, and Bandwidth Saturation probes.
- **Terminal Output Emulator:** Terminal card formatting output logs with colored indicators, dynamic elapsed execution delays, and packet loss metrics.
- **Automated Rule-Based RCA Algorithm:** Correlates failure ratios, probe anomalies, and device fault clustering to compute deterministic confidence scores (0–100%), identify suspect nodes, and generate remediation actions.

### 7. Command Palette & Universal Keyboard Accessibility
- **Global Keyboard Shortcut:** Activated globally via `Ctrl+K` or `Cmd+K`.
- **Fuzzy Search Navigation:** Immediate keyboard navigation across all sections, diagnostic tool triggers, incident reports, and preference toggles.
- **Full Keyboard Traversal:** Up/Down arrow navigation, `Enter` execution, and `ESC` dismissal.
- **Theme Switcher:** High-contrast Dark and Light color system with CSS custom property tokens.

### 8. Automated Incident Post-Mortem Reporting
- **Multi-Format Export:** Generates structured post-mortem summaries in formatted HTML and standard plain text (`.txt`).
- **One-Click Clipboard Transfer:** Direct clipboard copying with visual confirmation.
- **Native Browser Downloads:** Integrated binary blob generation for offline report distribution.

---

## Technology Stack

| Category | Technology | Usage Description |
| :--- | :--- | :--- |
| **Frontend Language** | JavaScript (ES6+) | Vanilla script architecture, asynchronous probe simulations, and state persistence |
| **Markup** | HTML5 | Semantic element structuring, accessibility attributes, and ARIA roles |
| **Styling & Layout** | CSS3 | Native CSS Grid, Flexbox, CSS Custom Properties (Variables), and responsive breakpoints |
| **Persistence** | Web Storage API (`localStorage`) | Client-side serialization for devices, incidents, diagnostics, and theme tokens |
| **Graphics** | SVG (Scalable Vector Graphics) | Dynamic link generation for network topology maps and custom UI iconography |
| **Automation & CI** | GitHub Actions | Continuous integration workflow validating repository structure and assets |
| **Hosting** | GitHub Pages | Static hosting infrastructure for public deployment |
| **Version Control** | Git | Semantic versioning, conventional commits, and trunk-based branching workflows |

---

## Project Directory Structure

```
netops-command-center-169646/
├── index.html              # Main application markup & DOM structure
├── .nojekyll               # GitHub Pages static asset pass-through configuration
├── README.md               # Project documentation & technical specifications
├── css/
│   └── style.css           # Design tokens, layouts, animations, and theme styles
├── js/
│   ├── utils.js            # Core utilities: HTML escaping, time formatting, normalizers
│   ├── state.js            # Initial dataset & centralized telemetry state accessors
│   ├── storage.js          # LocalStorage persistence wrapper & normalizer
│   ├── theme.js            # Dark/Light theme toggle & preference storage
│   ├── reports.js          # Post-mortem incident report generator (HTML/TXT)
│   ├── palette.js          # Command palette controller & global keyboard event listener
│   ├── dashboard.js        # Metric aggregations & live event ticker stream
│   ├── inventory.js        # Device inventory data table & slide-out telemetry panel
│   ├── topology.js         # SVG network topology map & link calculation
│   ├── incidents.js        # Incident lifecycle pipeline & stage management
│   ├── diagnostics.js      # Diagnostic tool probes & terminal console simulator
│   ├── rca.js              # Root Cause Analysis heuristic calculation & UI scoring
│   ├── history.js          # Investigation history log & resolved incident archive
│   └── app.js              # View navigation controller & dashboard renderer
├── docs/
│   └── architecture.md     # High-level architecture and subsystem descriptions
└── .github/
    └── workflows/
        └── validate.yml    # CI integrity validation workflow
```

---

## Local Installation & Setup

### Prerequisites
A modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari). No Node.js runtime or external package managers (`npm`/`yarn`) are required.

### Clone the Repository
```bash
git clone https://github.com/is-project-2026/netops-command-center-169646.git
cd netops-command-center-169646
```

### Running the Application

#### Option 1: Direct File Execution
Open the `index.html` file directly in any modern browser:
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

#### Option 2: Local Web Server (Recommended)
Using Python 3 built-in HTTP server:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using VS Code Live Server extension:
1. Open the project folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

---

## Quality Assurance & CI/CD Pipeline

The project implements automated validation using GitHub Actions (`.github/workflows/validate.yml`):
- **Structural Integrity:** Validates the presence and integrity of all essential static assets (`index.html`, `css/`, `js/`).
- **Zero Console Errors:** Defensive JavaScript execution safeguards all data parsing and DOM manipulation against runtime crashes.
- **Standards Compliance:** Full semantic validation, strict ARIA labeling, and responsive design verification across viewport sizes (mobile, tablet, desktop).

---

## Academic Declaration

This project was designed, architected, and implemented by **Dhruvin Hitesh Bhudia** (Student ID: **169646**) in partial fulfillment of the academic requirements for the **4th-Year Computer Science Degree** at **Strathmore University**.

All work presented herein reflects original engineering, design, and implementation adhering to institutional academic integrity guidelines.