# Mineral Sentinel (Strata-X) — AI Context & Dashboard Architecture Specification (`jetson.md`)

> **System Designation**: Mineral Sentinel / MineGuard AI (Project Strata-X)  
> **Operational Domain**: Real-Time Underground & Open-Cast Mine Subsidence Monitoring, Geotechnical Telemetry & Statutory Safety Early Warning System  
> **Target Hardware Platform**: NVIDIA Jetson Orin Nano (Edge AI Gateway & Inference Server) + ESP32-WROOM-32U Mesh Sensor Nodes  
> **Compliance Standard**: Directorate General of Mines Safety (DGMS) India Guidelines & Industrial Control-Room Engineering Standards  

---

## 1. Executive Summary & System Mission

**Mineral Sentinel** is an industrial-grade mine safety command center and edge-AI monitoring platform. It continuously tracks strata deformation, rock mass displacement, micro-seismic vibrations, and toxic gas buildup in coal mines (e.g., CMPDI Colliery No. 7 / Jharia Coalfield / Eastern Coalfields Raniganj Belt).

The system integrates:
1. **Underground Sensor Fleet**: Distributed ESP32 microcontroller nodes equipped with borehole extensometers, geophones, tell-tales, and gas sensors communicating over RS485 and low-power sub-GHz / WiFi mesh.
2. **Edge Computing Hub (NVIDIA Jetson Orin Nano)**: Ingests raw telemetry packets, runs local TensorRT-accelerated multi-sensor correlation algorithms, computes composite subsidence hazard risk scores, and generates 24-hour predictive trend horizons.
3. **Web Mission Control Dashboard**: A high-contrast, anti-slop industrial interface providing real-time 2D/3D GIS satellite mapping, alert dispatching, multi-sensor analytics, statutory shift reporting, and emergency safety drill simulation.

---

## 2. Hardware Architecture & Edge Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       UNDERGROUND EXCAVATION SITES                         │
│                                                                             │
│  [Node 01: Tailgate Roadway]              [Node 02: Main Gate Conveyor]     │
│  ├─ Borehole Extensometer (Displacement)  ├─ Roof Sag Tell-Tale             │
│  ├─ Displacement Rate (Velocity)          ├─ Sag Velocity                   │
│  ├─ Triaxial Geophone (Micro-seismicity)  ├─ Triaxial Geophone              │
│  ├─ Optical Methane Detector (CH4)        ├─ Optical Methane (CH4)          │
│  ├─ Electrochemical CO Sensor             ├─ Electrochemical CO             │
│  └─ Ambient & Strata Thermistor           └─ Strata Thermistor              │
└──────────────────────┬──────────────────────────────────┬───────────────────┘
                       │ RS-485 / WiFi Mesh (1.2-1.4 kbps)│
                       ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                NVIDIA JETSON ORIN NANO EDGE GATEWAY                         │
│  • Hostname / IP: `JETSON-ORIN-NANO-01` (192.168.1.120:8080)                │
│  • Edge Ingestion Engine: Validates incoming ESP32 JSON telemetry packets   │
│  • TensorRT Predictive Core: Local multi-sensor fusion & regression model    │
│  • REST / WebSocket Telemetry API: Serves live stream to Web Dashboard      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / WebSocket JSON Telemetry
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MINERAL SENTINEL WEB COMMAND CENTER                         │
│  • TopBar System Status, Clock, Node Counter & Active Alerts                │
│  • 2D/3D Satellite GIS Map of Jharia Coalfield Area 'D'                     │
│  • Live Radial Anomaly Gauges & Explainable AI Insights                     │
│  • Time-Series Dual-Axis Analytics & Cross-Parameter Correlation            │
│  • Statutory DGMS Shift Safety Reports (Export CSV / PDF)                   │
│  • Emergency Safety Drill Orchestrator (Simulated Strata Collapse)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Global Screen Layout & Navigation Shell

The user interface follows a persistent dual-rail layout:
- **Left Navigation Rail (Sidebar)**
- **Header Bar (TopBar)**
- **Active Workspace Body (Full-height Command Center or Scrollable Page Container)**
- **Floating Safety Drill Controller (Bottom-Right)**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: [MS Logo] Mineral Sentinel | Status Chip | Total Nodes | Alerts | Theme | User │
├──────┬─────────────────────────────────────────────────────────────────────────────────┤
│ S    │                                                                                 │
│ I    │                           ACTIVE WORKSPACE AREA                                 │
│ D    │                                                                                 │
│ E    │   [Command Center | GIS Map | Nodes | Sensors | Prediction | Alerts |           │
│ B    │    Analytics | Reports | Settings & Ingest | Operator Profile]                  │
│ A    │                                                                                 │
│ R    │                                                                                 │
├──────┴─────────────────────────────────────────────────────────────[ Drill Button ⚠ ]──┤
```

### 3.1 TopBar Elements (`src/components/layout/TopBar.tsx`)
1. **Brand Identity**: Blue shield icon + bold typography `"MINERAL SENTINEL | Mine Subsidence System"`. Clicking navigates immediately to the Command Center.
2. **System Status Pill**:
   - Dynamic indicator with glowing pulse dot.
   - Statuses: `OPERATIONAL` (Green), `WARNING` (Amber), `HIGH RISK` (Orange), `CRITICAL ALERT` (Red).
   - Clickable button: Navigates directly to the AI Prediction view.
3. **Total Nodes Pill**:
   - Radio icon + count (`TOTAL NODES: 128` or active node count).
   - Clickable button: Navigates directly to the Sensor Nodes Fleet page.
4. **Active Alerts Chip**:
   - Bell icon + live alert count (e.g. `1 (1 CRITICAL)`).
   - Glowing amber/red outline when alerts are active.
   - Clickable button: Navigates directly to the Alert Management page.
5. **Drill Active Banner**: When a safety drill is running, displays an animated red chip: `DRILL: [STAGE]`.
6. **Theme Switcher**: One-click toggle between `Dark` (Control-room matte charcoal `#080c14`) and `Light` mode.
7. **Real-Time Clock & Date**: Tabular monospace time (`HH:MM:SS AM/PM`) and formatted date (`Thu, 10 Sep 2026`).
8. **Operator Avatar Pill**: Badge `"SO"` for Senior Safety Officer. Clicking opens the Operator Profile view.

### 3.2 Sidebar Rail Navigation (`src/components/layout/Sidebar.tsx`)
A technical, expandable rail containing categorized navigation items:

* **Primary Operational Views**:
  - `command-center`: **Command Center** (Mission Control 2D/3D map + telemetry feeds)
  - `mine-map`: **Live GIS Map** (Underground schematic CAD/GIS seam layout)
  - `nodes`: **Sensor Nodes** (Hardware fleet telemetry, batteries, signal RSSI)
  - `sensors`: **Sensor Telemetry** (Searchable tabular telemetry & sensor calibration)
  - `prediction`: **AI Prediction** (NVIDIA Jetson TensorRT predictive strata engine)
  - `alerts`: **Alert Management** (Hazard feeds, notification badges, acknowledgments)
* **Intelligence & Compliance**:
  - `analytics`: **Multi-Sensor Analytics** (Dual-axis correlation studio)
  - `reports`: **Safety Reports** (Statutory DGMS shift reports & CSV/PDF export)
* **Administration & System**:
  - `settings`: **Settings & Ingest** (Edge gateway URL, hardware ingest trigger, thresholds)
  - `profile`: **Operator Profile** (Personnel credentials, shift assignments)
* **Sidebar Footer Indicators**:
  - Live Drill Status (if active)
  - Gateway Online Status: `"Gateway: Online — Jetson Orin Nano"`

---

## 4. Screen-by-Screen & Feature Breakdown

### 4.1 View 1: Command Center (`/command-center`)
The primary operational cockpit split into **Map Workspace (70% width)** and **Intelligence Panel (30% width)**.

#### A. Left Map Workspace
- **Top Banner**: Identifies site as `"JHARIA COALFIELD — AREA 'D' PANEL"` with geographic coordinates (`23.753° N, 86.417° E`) and Surface Subsidence Radar label.
- **2D / 3D Mode Toggle**:
  - `2D Mode`: Top-down orthographic satellite view (`/satellite-map.jpg`).
  - `3D Mode`: Oblique isometric satellite perspective (`/satellite-3d.jpg`) with elevation pin stems under sensor nodes and a 3D drawer.
- **Top-Right Map Controls**: Reset View (Compass icon), Zoom In (+), Zoom Out (-).
- **Satellite & SVG Overlays**:
  - **Mine Boundary Polygon**: Cyan dashed perimeter line `#38bdf8` with white vertex control anchors marking lease limits.
  - **Subsidence Deformation Heatmap**: Multi-stop radial gradients centered over high-subsidence goaf (`#ef4444` core > `#f97316` > `#eab308` > `#84cc16` > `#10b981`).
  - **Triangulation Wireframe Mesh**: Dashed white chords connecting nodes (e.g. `A12`, `A15`, `A47`, `B03`, `B04`, `C14`, `D08`) illustrating strain distribution.
  - **Sensor Markers**: Distributed nodes (`A47`, `A48`, `B03`, `B04`, `A12`, `C12`, `E05`, `F02`, etc.) with color-coded status rings and animated pulsing shockwaves for Warning/Critical points.
- **Interactive Node Tooltip Card**:
  - Appears on hover or click.
  - Displays: Node ID, Sector, Bench #, Depth, Status, Live Deformation Rate (`mm/yr`).
  - Contains direct action buttons: `"Node Details ➔"` and `"Telemetry ➔"`.
- **Bottom-Left Legend & Scale Bar**:
  - **Deformation Rate Legend**: `< 0.5 mm/yr` (Green), `0.5–2` (Yellow), `2–5` (Orange), `5–10` (Red), `> 10` (Dark Red).
  - **Scale Bar**: Calibrated 0 to 1,000 meters.
- **3D Right Drawer (in 3D Mode)**:
  - **Layer Controls Toggles**: Satellite Imagery, 3D Terrain Model, Subsidence Heatmap, Sensor Nodes, Mine Boundaries, Risk Zones.
  - **Transparency Slider**: Real-time slider adjusting heatmap opacity (10% to 100%).
  - **Time Range Selector**: Quick filter buttons (`7D`, `30D`, `90D`, `1Y`).
  - **Elevation Profile SVG**: Cross-sectional terrain curve slicing from rim (300m RL) down to open-cast pit floor (200m RL).
- **Bottom Timeline Bar (`TimelineBar.tsx`)**:
  - Scrubber controlling forecast horizons: `NOW`, `+24H`, `+48H`, `+72H`.
  - Play/Pause toggle with animated playback.
  - Mode indicator pill: `● LIVE DATA` (Green) vs `◆ PREDICTION` (Purple).
- **Emergency Safety Drill Banner**:
  - High-visibility red alert ribbon overlaid on the map whenever a drill is triggered.
  - Displays stage, elapsed time, risk level, and quick `ADVANCE` and `END DRILL` buttons.

#### B. Right Intelligence Panel (Stacked)
1. **Active Alert Feed (`AlertFeed.tsx`)**:
   - Shows top priority unacknowledged alerts sorted by severity (Critical > High Risk > Warning).
   - Parameters displayed: Sensor name, parameter metric, current reading, breach threshold, time elapsed.
   - Quick `"ACK"` button to acknowledge directly from the dashboard.
   - Header button navigates to the full Alerts page.
2. **AI Insights & Prediction Panel (`AIInsightsPanel.tsx`)**:
   - **Radial Semi-Circle Anomaly Gauge**: Displays the composite risk score (0 to 100) with color transition (Green -> Amber -> Orange -> Red).
   - **Model Accuracy & Edge Status**: Displays confidence percentage (e.g. 85-94%) and active edge inference status on Jetson Orin Nano.
   - **Factor Attribution Bars**: Relative weight of drivers (Roof Displacement %, Sag Velocity %, Micro-seismic burst rate %, Goaf gas desorption %).
   - **AI Diagnostic Rationale**: Plain-text explainable summary generated by the prediction service detailing strata mechanics.
3. **Selected Node Telemetry (`NodeTelemetry.tsx`)**:
   - Displays real-time readings and SVG sparklines for all sensors connected to the currently selected node (e.g. `NODE-01`).
   - Metrics: Extensometer displacement (`mm`), Velocity (`mm/hr`), Vibration (`mm/s`), Methane (`% Vol`), CO (`ppm`), Temperature (`°C`).

---

### 4.2 View 2: Underground Mine GIS & Strata Layout (`/mine-map`)
Schematic geological and extraction CAD/GIS projection representing underground roadways and longwall panels:
- **Geological Layer Controls**:
  - Checkboxes for `Roadways`, `Extraction Panels`, `Sensors & Tell-Tales`, `Ventilation Circuits`, `Risk Heatmap`.
- **Underground Seam Topology**:
  - `Panel 4B Tailgate Roadway` (Active extraction panel, depth 340m, Dishergarh Seam III).
  - `Panel 4A Main Gate Conveyor` (Coal haulage trunk & intake airway, depth 320m).
  - `Main Intake Trunk Roadway` (Intake air from shaft bottom, heavy steel arches).
  - `South Return Airway Cross-cut` (Vitiated bleeder airway, goaf gas monitoring).
- **Inspector Drawer**:
  - Inspect any selected node (`NODE-01`, `NODE-02`).
  - View live hardware health, battery level, RSSI, and individual sensor gauges.

---

### 4.3 View 3: ESP32 Edge Sensor Nodes (`/nodes`)
Hardware fleet management and telemetry monitoring:
- **Node Cards**:
  - **Hardware Metadata**: Model (`ESP32-WROOM-32U Ext-Antenna`), Firmware (`v2.4.1-mineguard-esp32`), Static IP (`192.168.1.141`), Gateway target (`JETSON-ORIN-NANO-01`).
  - **Signal Strength (RSSI)**: Calibrated in -dBm with qualitative grading (Excellent / Good / Fair / Poor).
  - **Battery Telemetry**: Dual battery voltage reading (e.g. 3.98 V) and percentage (94%) with LiFePO4 / Li-ion discharge status.
  - **Data Rate**: Uplink transmission speed (e.g. 1.4 kbps over RS485/WiFi Mesh).
  - **Connected Sensors Chips**: Quick tags linking directly to the sensor telemetry.
- **Node Registration Modal**: Allows operators to provision a new ESP32 node into a specific underground zone.

---

### 4.4 View 4: Sensor Telemetry Explorer (`/sensors`)
Deep telemetry inspection and calibration table:
- **Search & Multi-Filters**: Filter by text query, monitoring zone, sensor type (Displacement, Rate, Vibration, Gas, Temp), and statutory status.
- **Sortable Columns**: Sensor ID, Name, Zone, Reading, Velocity/Rate, Risk Contribution (%), Status.
- **Sensor Detail Modal**:
  - Full 24-point historical sparkline graph.
  - Statutory threshold limits configuration display (Warning, High Risk, Critical).
  - Sensor health, physical installation depth, and AI contribution weighting.

---

### 4.5 View 5: AI Subsidence Prediction Engine (`/prediction`)
The explainable machine learning dashboard powered by NVIDIA Jetson:
- **Observed vs. Predicted 24-Hour Horizon Graph**:
  - SVG visualization displaying observed past 12-hour telemetry joined continuously with a 24-hour future prediction curve.
  - **Confidence Interval Polygon**: Light purple shaded upper and lower confidence spread indicating model uncertainty growth over time.
  - Hoverable points displaying timestamp, predicted displacement (`mm`), and error bounds.
- **Multi-Factor Correlation Attribution**:
  - Breakdown of key hazard drivers:
    - *Borehole Strata Extensometer*: 35% nominal weight
    - *Displacement Velocity Acceleration*: 30% nominal weight
    - *Triaxial Geophone Micro-seismic Bursts*: 20% nominal weight
    - *Goaf Methane Desorption & Pillar Crushing*: 15% nominal weight
- **Model Transparency & Architecture Card**:
  - Runtime: `TensorRT 8.6 / JetPack 5.1 / CUDA 11.4` on Jetson Orin Nano.
  - Latency: `< 4.2 ms` inference cycle per sensor frame.
  - Features: Multi-variate autoregressive LSTM + XGBoost hazard classifier.

---

### 4.6 View 6: Underground Hazard & Alert Management (`/alerts`)
Statutory control-room dispatch and emergency alarm center:
- **Categorization Tabs**: `ALL`, `CRITICAL`, `HIGH_RISK`, `WARNING`, `ACKNOWLEDGED`.
- **Search Bar**: Query alerts by sensor, parameter, zone, or node ID.
- **Alert Cards**:
  - Severity badge with audible/visual pulse indications.
  - Parameter reading at trigger time vs. statutory threshold.
  - Rate of change during breach.
  - AI Risk Score attribution.
- **Operator Acknowledge Action**:
  - Logs timestamp, shift officer name, and notes for DGMS audit compliance.

---

### 4.7 View 7: Multi-Sensor Analytics (`/analytics`)
Geotechnical time-series correlation studio:
- **Dual-Axis Cross-Parameter Chart**:
  - **Left Y-Axis (Cyan)**: Borehole Extensometer Displacement (`0 to 35 mm`).
  - **Right Y-Axis (Purple)**: Micro-seismic Vibration Velocity (`0 to 18 mm/s`).
  - Interactive SVG plot displaying joint peaks where acoustic emissions precede strata bed detachment.
- **Time Range Filters**: `1h`, `6h`, `24h`, `7d`, `30d`.
- **Zone Selector**: Compare correlation between extraction panels (Panel 4B Tailgate vs. Panel 4A Conveyor).
- **Statistical Cards**: Peak deformation rate, maximum micro-seismic spike, correlation coefficient ($r = 0.88$).

---

### 4.8 View 8: Statutory Mine Safety & Subsidence Shift Reports (`/reports`)
DGMS compliance reporting and shift handover generation:
- **Automated Report Generator**:
  - Automatically compiles telemetry data for Shift A (Morning), Shift B (Evening), or Shift C (Night).
  - Summarizes node uptime %, sensor availability, alert tallies, max observed sag, and peak methane ppm.
  - Logs critical safety events and operator sign-offs.
- **Export Actions**:
  - **Refresh Report**: Re-evaluates current live state into an official shift snapshot.
  - **Export CSV**: Downloads complete tabular sensor logs for external geotechnical modeling.
  - **Print / PDF Export**: Triggers a clean print stylesheet formatted for physical control-room binders.

---

### 4.9 View 9: System Settings & Edge Hardware Ingestion (`/settings`)
Configuration and hardware bridge controls:
- **Colliery Profile**: Mine Name, DGMS Site ID, Active Shift.
- **Data Source Switch**: Toggle between `SIMULATION` (jittered simulation for demos/training) and `JETSON_GATEWAY` (live HTTP ingest).
- **Edge Gateway Endpoint**: URL (`http://192.168.1.120:8080/api/v1/telemetry`) and connection status check.
- **Threshold Limit Configuration**: Adjust DGMS Warning and Critical trigger points for Displacement, Vibration, and Methane.
- **Live Ingest Simulator / Test**: Button to inject a real sample ESP32 payload directly into the pipeline to test hardware connectivity.
- **JSON Telemetry Contract Viewer**: Embedded syntax-highlighted schema showing the exact expected packet contract.

---

### 4.10 View 10: Control Room Operator Profile (`/profile`)
Personnel credentials and authorization:
- Profile details for Senior Mine Safety Officer (A. K. Sengupta, ID: `CMPDI-SO-4821`).
- DGMS First Class Mine Manager's Certificate reference.
- Shift assignment details, emergency contact lines, and role-based access level (`COMMAND_ADMIN`).

---

### 4.11 Floating Safety Drill Controller (`SimulationController.tsx`)
A persistent floating modal available across all screens via the bottom-right button:
- **Purpose**: Allows safety inspectors to conduct unannounced subsidence evacuation drills without risking personnel.
- **4 Progression Stages**:
  1. `NORMAL`: Baseline ground equilibrium (Displacement: 6.4 mm, Velocity: 0.12 mm/hr, Risk: 24%).
  2. `WARNING`: Incipient strata separation (Displacement: 13.5 mm, Rate: 1.42 mm/hr, Warning alarm).
  3. `HIGH_RISK`: Rapid tensile crack propagation (Displacement: 21.8 mm, Vibration: 9.4 mm/s, High Risk).
  4. `CRITICAL`: Imminent roof fall / subsidence hazard (Displacement: 29.6 mm, Velocity: 5.2 mm/hr, Evacuation siren).
- **Features**: Step-by-step advance, auto-progress timer, immediate reset, and live alert emission.

---

## 5. Sensor Fleet & Statutory Threshold Reference Table

| Sensor ID | Monitored Zone | Measurement Type | Engineering Unit | Normal Range | Warning Threshold | Critical Threshold | AI Risk Weight |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `SN-01-DISP` | Panel 4B Tailgate | Roof Extensometer | `mm` | 0 – 10.0 | **12.0 mm** | **28.0 mm** | 35% |
| `SN-01-DISP-RATE` | Panel 4B Tailgate | Displacement Velocity | `mm/hr` | 0 – 0.5 | **1.2 mm/hr** | **4.5 mm/hr** | 30% |
| `SN-01-VIB` | Panel 4B Tailgate | Triaxial Geophone | `mm/s` | 0 – 2.5 | **4.0 mm/s** | **14.0 mm/s** | 20% |
| `SN-01-CH4` | Panel 4B Tailgate | Optical Methane | `% Vol` | 0 – 0.4 | **0.80 % Vol** | **1.75 % Vol** | 10% |
| `SN-01-CO` | Panel 4B Tailgate | Carbon Monoxide | `ppm` | 0 – 15 | **25 ppm** | **70 ppm** | 3% |
| `SN-01-TEMP` | Panel 4B Tailgate | Strata Thermistor | `°C` | 22 – 30 | **32.0 °C** | **42.0 °C** | 2% |
| `SN-02-DISP` | Panel 4A Main Gate | Roof Sag Tell-Tale | `mm` | 0 – 8.0 | **12.0 mm** | **28.0 mm` | 35% |
| `SN-02-DISP-RATE` | Panel 4A Main Gate | Sag Velocity | `mm/hr` | 0 – 0.4 | **1.2 mm/hr** | **4.5 mm/hr** | 30% |
| `SN-02-VIB` | Panel 4A Main Gate | Triaxial Geophone | `mm/s` | 0 – 2.0 | **4.0 mm/s** | **14.0 mm/s** | 20% |
| `SN-02-CH4` | Panel 4A Main Gate | Optical Methane | `% Vol` | 0 – 0.3 | **0.80 % Vol** | **1.75 % Vol** | 10% |

---

## 6. Edge Hardware Telemetry Packet Contract (JSON Schema)

When communicating between ESP32 nodes, the Jetson Orin Nano, and the Strata-X web dashboard, the payload follows this exact TypeScript contract (`src/services/gatewayService.ts`):

```json
{
  "gateway_id": "JETSON-ORIN-NANO-01",
  "node_id": "NODE-01",
  "zone_id": "ZONE-P4B",
  "timestamp": 1773312000000,
  "battery_v": 3.98,
  "rssi_dbm": -64,
  "firmware": "v2.4.1-mineguard-esp32",
  "readings": [
    {
      "sensor_id": "SN-01-DISP",
      "type": "displacement",
      "value": 6.42,
      "unit": "mm"
    },
    {
      "sensor_id": "SN-01-DISP-RATE",
      "type": "displacement_rate",
      "value": 0.14,
      "unit": "mm/hr"
    },
    {
      "sensor_id": "SN-01-VIB",
      "type": "vibration",
      "value": 1.85,
      "unit": "mm/s"
    },
    {
      "sensor_id": "SN-01-CH4",
      "type": "methane",
      "value": 0.28,
      "unit": "% Vol"
    },
    {
      "sensor_id": "SN-01-CO",
      "type": "carbon_monoxide",
      "value": 8.5,
      "unit": "ppm"
    },
    {
      "sensor_id": "SN-01-TEMP",
      "type": "temperature",
      "value": 27.2,
      "unit": "°C"
    }
  ]
}
```

### Ingestion Logic:
- **Node Updates**: Jetson recalculates battery percentage using standard Li-ion curve `((battery_v - 3.2) / 1.0) * 100`, updates RSSI dBm, sets node status to `ONLINE`, and registers heartbeat timestamp.
- **Sensor Updates**: Computes instant delta rate of change:
  $$\text{Rate (mm/hr)} = \frac{\text{Current Value} - \text{Previous Value}}{\Delta t \text{ (hours)}}$$
  Pushes new reading into a sliding 24-point historical buffer.
- **Risk Recomputation**: Triggers the AI Prediction Service immediately upon receiving updated values.

---

## 7. Edge AI Risk Scoring & Predictive Algorithm

The prediction engine on the Jetson Orin Nano executes a composite multi-parameter regression:

### 7.1 Multi-Factor Composite Calculation
$$\text{Score}_{\text{disp}} = \min\left(100, \frac{\text{Displacement}}{28.0} \times 100\right)$$
$$\text{Score}_{\text{rate}} = \min\left(100, \frac{\text{Velocity}}{4.5} \times 100\right)$$
$$\text{Score}_{\text{vib}} = \min\left(100, \frac{\text{Vibration}}{14.0} \times 100\right)$$
$$\text{Score}_{\text{gas}} = \min\left(100, \frac{\text{CH}_4}{1.75} \times 100\right)$$

$$\text{Composite Risk} = (0.35 \times \text{Score}_{\text{disp}}) + (0.30 \times \text{Score}_{\text{rate}}) + (0.20 \times \text{Score}_{\text{vib}}) + (0.15 \times \text{Score}_{\text{gas}})$$

### 7.2 Safety Status Classification:
- **Score $\ge 80$**: `CRITICAL` (Imminent subsidence hazard, trigger audio alert & evacuation protocol)
- **Score $60 - 79$**: `HIGH_RISK` (Rapid acceleration, immediate support reinforcement required)
- **Score $40 - 59$**: `WARNING` (Advisory threshold breach, monitor closely)
- **Score $< 40$**: `NORMAL` (Ground equilibrium stable)

### 7.3 24-Hour Horizon Extrapolation:
For each step $i \in [1, 12]$ representing future hours $h = i \times 2$:
$$\text{Predicted Value} = \text{Displacement} + (h \times \text{Velocity} \times \text{Slope Multiplier})$$
$$\text{Confidence Spread} = h \times 0.15 \times \left(\frac{\text{Risk Score}}{50}\right)$$
$$\text{Upper Band} = \text{Predicted Value} + \text{Confidence Spread}$$
$$\text{Lower Band} = \max(\text{Displacement}, \text{Predicted Value} - \text{Confidence Spread})$$

---

## 8. Design System & Control-Room Visual Tokens

The frontend adheres strictly to anti-slop control-room standards (`DESIGN.md`):
- **Typography**: Inter (UI Chrome & Labels); JetBrains Mono with `tabular-nums` / `font-feature-settings: 'tnum'` for telemetry to prevent metric jitter.
- **Color Palette (Dark Mode Canvas)**:
  - App Background: `#080c14`
  - Sidebar: `#0b111c`
  - Panel Background: `#0f172a`
  - Header / Overlay: `#141f36`
  - Borders: 1px technical grid `#1e293b` / `#2a3a54`
- **Safety Tokens**:
  - `NORMAL`: `#10b981` (Safe ground equilibrium)
  - `WARNING`: `#f59e0b` (Configurable threshold advisory)
  - `HIGH_RISK`: `#f97316` (Multi-sensor correlation breach)
  - `CRITICAL`: `#ef4444` (Imminent subsidence hazard)
  - `TELEMETRY`: `#06b6d4` (Extensometer / Primary data)
  - `SEISMIC`: `#a855f7` (Triaxial geophones / Prediction horizon)

---

## 9. Quick Context Cheatsheet for AI Assistants

When analyzing, debugging, or generating features for this system:
1. **Primary Project Root**: `d:\strata-x`
2. **State Management**: Centralized in `src/context/AppContext.tsx` with actions for alerting, drill orchestration, config updates, and packet ingestion.
3. **Hardware Gateway File**: `src/services/gatewayService.ts` handles ESP32 / Jetson Orin Nano packet parsing.
4. **AI Prediction Engine**: `src/services/predictionService.ts` calculates real-time risk scores and prediction curves.
5. **Main GIS Map**: `src/components/command-center/MapCanvas.tsx` renders the 2D/3D satellite orthoimagery and subsidence heatmaps.
6. **Statutory Standards**: Follows Indian Directorate General of Mines Safety (DGMS) regulatory limits for underground coal extraction.

---

## 10. Remote Server Backend WebSocket Integration Guide (`Frontend <-> Backend`)

This section specifies the changes and contracts required on the **Remote Backend Server** (running on Jetson Orin Nano or remote cloud/edge instance) to stream sensor telemetry and LLM inference directly to the Strata-X web frontend over **WebSocket**.

### 10.1 System Architecture

```text
┌───────────────────────────┐
│ ESP32 / Mesh Sensor Fleet │
└─────────────┬─────────────┘
              │ MQTT
              ▼
┌────────────────────────────────────────────────────────┐
│ REMOTE EDGE / CLOUD SERVER                             │
│ 1. MQTT Subscriber (receives raw sensor telemetry)     │
│ 2. Telemetry Processor (aggregates & normalizes)       │
│ 3. LLM Inference (analyzes trends, anomalies, risks)   │
│ 4. WebSocket Server Broadcasts to active clients       │
└─────────────────────────────┬──────────────────────────┘
                              │ Bidirectional WebSocket
                              │ ws://REMOTE_SERVER_IP:PORT/ws
                              ▼
┌────────────────────────────────────────────────────────┐
│ STRATA-X FRONTEND COMMAND CENTER                       │
│ - WebSocketService (src/services/websocketService.ts)  │
│ - AppContext state distribution                        │
│ - Real-Time Dashboard (Command Center & Sensors)       │
└────────────────────────────────────────────────────────┘
```

### 10.2 Remote Server Requirements

The remote server must provide:
1. **WebSocket Endpoint**:
   - `ws://REMOTE_SERVER_IP:PORT/ws` (or `wss://...` if behind SSL/TLS reverse proxy).
2. **Allowed Origins (CORS & Origin Validation)**:
   - Must accept connections from the frontend host/origin (e.g. `http://localhost:5173`, `http://FRONTEND_IP:PORT`, or wildcard `*` during development).
3. **Continuous Streaming**:
   - As new MQTT messages arrive and are processed by the LLM, the remote server immediately pushes the processed JSON frame over all active WebSocket connections.
4. **Heartbeat / Ping Handling**:
   - The server should handle client ping frames: `{"type": "ping", "client": "...", "timestamp": ...}`.

---

### 10.3 JSON Telemetry Packet Contract (Server -> Frontend)

The WebSocket server sends JSON frames in either single-device or multi-device format:

#### Single Device Payload Format:
```json
{
  "device_id": "ESP32_01",
  "timestamp": "2026-09-11T15:30:00Z",
  "sensors": {
    "temperature": 31.5,
    "humidity": 68.0,
    "object_count": 12,
    "displacement": 6.42,
    "vibration": 1.85,
    "methane": 0.28,
    "carbon_monoxide": 8.5
  },
  "analysis": {
    "status": "warning",
    "risk_level": "medium",
    "message": "Temperature is elevated (+3.1°C). Minor strata dilation detected near roof roadway."
  }
}
```

#### Multi-Device Payload Format:
```json
{
  "devices": [
    {
      "device_id": "ESP32_01",
      "timestamp": 1773312000000,
      "sensors": {
        "temperature": 28.4,
        "humidity": 62.0,
        "displacement": 6.12,
        "vibration": 1.62
      },
      "analysis": {
        "status": "normal",
        "risk_level": "low",
        "message": "Normal strata equilibrium."
      }
    },
    {
      "device_id": "ESP32_02",
      "timestamp": 1773312000000,
      "sensors": {
        "temperature": 33.8,
        "methane": 0.85,
        "displacement": 14.2
      },
      "analysis": {
        "status": "warning",
        "risk_level": "medium",
        "message": "Advisory methane accumulation near return crosscut."
      }
    }
  ]
}
```

#### Field Specifications:
- `device_id` (string, required): Hardware identifier (e.g. `"ESP32_01"`, `"NODE-01"`).
- `timestamp` (ISO-8601 string or Unix epoch ms, optional): Time of observation.
- `sensors` (object, required): Dynamic key-value pairs representing calibrated engineering values:
  - `temperature` (`°C`)
  - `humidity` (`%`)
  - `object_count` (`units`)
  - `displacement` (`mm`)
  - `vibration` (`mm/s`)
  - `methane` (`% Vol`)
  - `carbon_monoxide` (`ppm`)
- `analysis` (object, optional):
  - `status`: `"normal" | "warning" | "high_risk" | "critical"`
  - `risk_level`: `"low" | "medium" | "high" | "critical"`
  - `message`: Diagnostic statement generated by the LLM based on sensor readings.

---

### 10.4 Python / FastAPI Remote Server Implementation Example

Create or update your server script (e.g., `main.py`) on the remote server:

```python
import asyncio
import json
import paho.mqtt.client as mqtt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MineGuard AI Edge Ingest Gateway")

# 1. Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify: ["http://localhost:5173", "http://192.168.1.50:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        payload_str = json.dumps(data)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload_str)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# 3. WebSocket Route for Frontend
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive client messages / heartbeats
            data = await websocket.receive_text()
            print(f"[WS Client Message]: {data}")
            # Echo or process client ping if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 4. MQTT Telemetry Ingestion -> LLM Inference -> Broadcast
# Example callback triggered when raw sensor data arrives via MQTT:
async def handle_mqtt_telemetry(raw_payload: dict):
    # 1. Parse raw sensor data from ESP32
    device_id = raw_payload.get("device_id", "ESP32_01")
    sensors = raw_payload.get("sensors", {})

    # 2. Run LLM inference or multi-parameter correlation
    # llm_result = await run_llm_inference(sensors)
    llm_result = {
        "status": "warning" if sensors.get("temperature", 0) > 31 else "normal",
        "risk_level": "medium" if sensors.get("temperature", 0) > 31 else "low",
        "message": "Strata temperature elevated above normal operating threshold."
    }

    # 3. Broadcast to all connected frontend command centers
    packet = {
        "device_id": device_id,
        "timestamp": raw_payload.get("timestamp"),
        "sensors": sensors,
        "analysis": llm_result
    }
    await manager.broadcast(packet)

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 so other machines on the LAN / internet can connect
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### 10.5 Node.js / Express Alternative Implementation

If using Node.js on the remote machine:

```javascript
import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WS] Frontend command center connected');

  ws.on('message', (message) => {
    console.log('[WS Client Message]:', message.toString());
  });
});

// Broadcast function called when MQTT message + LLM processing completes:
export function broadcastTelemetry(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  });
}

server.listen(8000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:8000 and ws://0.0.0.0:8000/ws');
});
```

---

### 10.6 Network & Security Configuration

1. **Host Binding**: Ensure the server binds to `0.0.0.0` (all interfaces), not `127.0.0.1` (localhost only), so external devices can reach it.
2. **Firewall Rule**:
   ```bash
   # On Ubuntu / Jetson Linux
   sudo ufw allow 8000/tcp
   ```
3. **Frontend Configuration**:
   In the Strata-X frontend `.env` file, point `VITE_WS_URL` to the remote server's IP:
   ```env
   VITE_WS_URL=ws://192.168.1.120:8000/ws
   ```
4. **Public Deployment**: If hosting over public WAN, terminate SSL using Nginx or Caddy reverse proxy (`wss://your-domain.com/ws`), and ensure proper firewalling.

