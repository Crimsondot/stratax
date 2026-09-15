# MineGuard AI — Design System & Engineering Guidelines (`DESIGN.md`)

*Derived from Vercel Web Interface Guidelines, Taste-Skill, and Industrial Control-Room Engineering Standards.*

---

## 1. Core Visual Philosophy: Industrial Precision & Anti-Slop Discipline

MineGuard AI is a real-time digital mine safety command center for underground coal mines.
- **Anti-Slop Rules (from Taste Skill)**:
  - **No nested cards-inside-cards**: Panels contain distinct functional zones, not recursive boxed cards.
  - **No decorative glassmorphism or floating glow clichés**: Serious industrial monitors require matte backgrounds, high contrast, and crisp 1px borders.
  - **Restrained color tokens**: Vibrant accents are reserved exclusively for safety statuses (🟢 Normal, 🟡 Warning, 🟠 High Risk, 🔴 Critical) and telemetry instruments.
  - **Macro-spacing & Breathability**: Generous padding (16px to 24px) between major operational units to reduce visual fatigue during 8-hour control-room shifts.

---

## 2. Color Palette & Token System

```css
:root {
  /* Control-Room Canvas (Matte Charcoal & Void Navy) */
  --bg-app: #080c14;
  --bg-sidebar: #0b111c;
  --bg-panel: #0f172a;
  --bg-panel-header: #141f36;
  --bg-panel-elevated: #162238;
  --bg-input: #0a0f1d;
  --bg-hover: #1e293b;

  /* Borders (Subtle 1px Technical Grid) */
  --border-subtle: #1e293b;
  --border-medium: #2a3a54;
  --border-strong: #3b4e6d;
  --border-focus: #0ea5e9;

  /* Text & Labels */
  --text-bright: #ffffff;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Statutory Safety Status Tokens */
  --color-normal: #10b981;    /* Safe ground equilibrium */
  --bg-normal: rgba(16, 185, 129, 0.12);
  --border-normal: rgba(16, 185, 129, 0.4);

  --color-warning: #f59e0b;   /* Configurable threshold advisory */
  --bg-warning: rgba(245, 158, 11, 0.14);
  --border-warning: rgba(245, 158, 11, 0.45);

  --color-high-risk: #f97316; /* Multi-sensor correlation / acceleration */
  --bg-high-risk: rgba(249, 115, 22, 0.16);
  --border-high-risk: rgba(249, 115, 22, 0.5);

  --color-critical: #ef4444;  /* Imminent subsidence hazard */
  --bg-critical: rgba(239, 68, 68, 0.20);
  --border-critical: rgba(239, 68, 68, 0.6);

  /* Telemetry Instruments */
  --color-telemetry: #06b6d4; /* Extensometer Displacement / Primary */
  --color-purple: #a855f7;    /* Triaxial Geophone / Micro-seismicity */
}
```

---

## 3. Typography & Numerical Precision (Vercel Guidelines)

- **UI Chrome & Text**: `Inter`, system sans-serif. Headings use `text-wrap: balance` to prevent awkward single-word wraps.
- **Instrument Readings & Telemetry**: Monospace (`JetBrains Mono`, `Consolas`, monospace) with mandatory:
  ```css
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  ```
  This guarantees that rapidly fluctuating sensor metrics never cause jitter or layout shifts.
- **Measurement Units**: Always use non-breaking spaces between value and engineering unit (e.g., `12.4&nbsp;mm`, `4.1&nbsp;mm/s`, `0.28%&nbsp;Vol`).
- **Ellipses**: Use typographic character `…` instead of `...`.

---

## 4. Accessibility & Interaction Standards (Vercel Guidelines)

- **Focus Visibility**: Every interactive button, input, and selector must have a visible, accessible `:focus-visible` ring (`outline: 2px solid var(--border-focus); outline-offset: 2px;`).
- **Semantic Buttons**: All actions use native `<button type="button">` or `<button type="submit">`, never raw clickable `<div>`s without role and keyboard listeners.
- **Icon Labels**: All icon-only buttons include descriptive `aria-label` attributes (e.g., `aria-label="Zoom in map"`, `aria-label="Acknowledge alert"`).
- **Decorative Icons**: Accompanied text uses `aria-hidden="true"` on decorative icons to prevent screen-reader clutter.
- **Dynamic Updates**: Alert feeds and emergency banners declare `aria-live="polite"` so operators using assistive tech are notified of safety breaches.
- **Prefers-Reduced-Motion**: Under `@media (prefers-reduced-motion: reduce)`, disable pulse keyframe animations.
- **Form Best Practices**:
  - Clickable labels via `htmlFor`.
  - `spellCheck={false}` on IDs, IP addresses, and thresholds.
  - Inputs specify meaningful `name` and appropriate input types.

---

## 5. Information Architecture & Priority

1. **CRITICAL ALERTS & EMERGENCY DRILL STATE** (Always prominent top banner and immediate acknowledge trigger)
2. **Mine Global Safety Status** (TopBar badge and Command Center status panel)
3. **Active Node Fleet & Mesh Connectivity** (Heartbeats, battery V, signal dBm)
4. **AI Subsidence Risk & Explainable Attribution** (Why is risk changing?)
5. **Live Strata Telemetry & Correlation Trends** (Sparklines, dual-axis graphs)
6. **CAD / GIS Underground Mine Schematic** (Panels, roadways, sensors, hazard zones)
7. **Statutory Reports & Historical Compliance** (CSV export, Print/PDF views)
