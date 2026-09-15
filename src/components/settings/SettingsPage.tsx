import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GatewayService } from '../../services/gatewayService';
import { playSoundEffect } from '../../services/interactionSound';
import {
  Settings,
  Sliders,
  Radio,
  Cpu,
  Save,
  CheckCircle,
  HardDrive,
  Send,
  Code,
  Bell,
  Globe,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    config,
    updateConfig,
    triggerHardwareIngestDemo,
    wsState,
    sendWsData,
    reconnectWs,
  } = useApp();

  const [mineName, setMineName] = useState(config.mineName);
  const [siteId, setSiteId] = useState(config.siteId);
  const [activeShift, setActiveShift] = useState(config.activeShift);
  const [gatewayUrl, setGatewayUrl] = useState(config.gatewayUrl);
  const [prometheusApiUrl, setPrometheusApiUrl] = useState(config.prometheusApiUrl);
  const [dataSource, setDataSource] = useState(config.dataSource);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);
  const [wsSentSuccess, setWsSentSuccess] = useState(false);

  // Configurable Safety Thresholds
  const [dispWarn, setDispWarn] = useState('12.0');
  const [dispCrit, setDispCrit] = useState('28.0');
  const [vibWarn, setVibWarn] = useState('4.0');
  const [vibCrit, setVibCrit] = useState('14.0');
  const [ch4Warn, setCh4Warn] = useState('0.80');
  const [ch4Crit, setCh4Crit] = useState('1.75');

  const handleSave = () => {
    updateConfig({
      mineName,
      siteId,
      activeShift: activeShift as any,
      gatewayUrl,
      prometheusApiUrl,
      dataSource: dataSource as any,
    });
    reconnectWs(gatewayUrl);
    setSavedSuccess(true);
    playSoundEffect('save-success');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTestWs = () => {
    const success = sendWsData({
      type: 'ping',
      client: 'Strata-X Frontend Command Center',
      timestamp: Date.now(),
    });
    if (success) {
      setWsSentSuccess(true);
      setTimeout(() => setWsSentSuccess(false), 2500);
    }
  };

  const handleTestIngest = () => {
    triggerHardwareIngestDemo();
    setIngestSuccess(true);
    setTimeout(() => setIngestSuccess(false), 3000);
  };

  const samplePacket = GatewayService.getSampleHardwarePacket();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Settings size={22} color="var(--color-telemetry)" />
            <span>System Settings & Edge Hardware Ingestion</span>
          </h1>
          <p>
            Configure Colliery Profiles • Threshold Limits • Jetson Orin Nano Edge Gateway Ingest API
          </p>
        </div>

        <div className="header-actions">
          {savedSuccess && (
            <span style={{
              color: 'var(--color-normal)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              animation: 'checkmark-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7.5L5.5 11L12 3" stroke="var(--color-normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    strokeDasharray: 20,
                    strokeDashoffset: 20,
                    animation: 'checkmark-draw 0.3s ease 0.1s forwards',
                  }}
                />
              </svg>
              Saved Successfully
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={14} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Grid: Mine Profile & Data Source */}
      <div className="grid-2">
        {/* Mine & Colliery Profile */}
        <div className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title">
              <Globe size={16} color="var(--color-telemetry)" />
              <span>Colliery Identification & Shift</span>
            </div>
          </div>
          <div className="control-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Colliery / Mine Name
              </label>
              <input
                type="text"
                value={mineName}
                onChange={e => setMineName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '4px',
                  color: 'var(--text-bright)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div className="grid-2" style={{ gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  DGMS Site Identifier
                </label>
                <input
                  type="text"
                  value={siteId}
                  onChange={e => setSiteId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    color: 'var(--text-bright)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Active Shift Assignment
                </label>
                <select
                  value={activeShift}
                  onChange={e => setActiveShift(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    color: 'var(--text-bright)',
                    fontSize: '13px',
                  }}
                >
                  <option value="Shift A (Morning)">Shift A (Morning - 06:00 to 14:00)</option>
                  <option value="Shift B (Evening)">Shift B (Evening - 14:00 to 22:00)</option>
                  <option value="Shift C (Night)">Shift C (Night - 22:00 to 06:00)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Source & Gateway Ingest */}
        <div className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title">
              <Cpu size={16} color="var(--color-telemetry)" />
              <span>Remote Server WebSocket Telemetry Bridge</span>
            </div>
            <span className="demo-tag" style={{
              background: wsState.status === 'CONNECTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: wsState.status === 'CONNECTED' ? 'var(--color-normal)' : 'var(--color-critical)',
              border: `1px solid ${wsState.status === 'CONNECTED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {wsState.status === 'CONNECTED' ? 'WS CONNECTED' : `WS ${wsState.status}`}
            </span>
          </div>
          <div className="control-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Active Telemetry Source Mode
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dataSource"
                    checked={dataSource === 'SIMULATION'}
                    onChange={() => setDataSource('SIMULATION')}
                  />
                  <span>Simulation Engine (Local Fallback)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dataSource"
                    checked={dataSource === 'REMOTE_WEBSOCKET'}
                    onChange={() => setDataSource('REMOTE_WEBSOCKET')}
                  />
                  <span>Live Remote WebSocket Server</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dataSource"
                    checked={dataSource === 'PROMETHEUS'}
                    onChange={() => setDataSource('PROMETHEUS')}
                  />
                  <span>Prometheus (via Strata-X API)</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Strata-X Prometheus API URL
              </label>
              <input
                type="text"
                value={prometheusApiUrl}
                onChange={e => setPrometheusApiUrl(e.target.value)}
                placeholder="http://192.168.1.120:8000"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '4px', color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>The app calls the backend proxy; do not enter a Prometheus token in the dashboard or Android app.</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Remote WebSocket Endpoint URL (VITE_WS_URL)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={gatewayUrl}
                  onChange={e => setGatewayUrl(e.target.value)}
                  placeholder="ws://192.168.1.120:8000/ws"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    color: 'var(--text-bright)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                  }}
                />
                <button
                  className="btn btn-sm"
                  onClick={() => reconnectWs(gatewayUrl)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Reconnect
                </button>
              </div>
              {wsState.errorMessage && (
                <div style={{ fontSize: '11px', color: 'var(--color-critical)', marginTop: '4px' }}>
                  ⚠ {wsState.errorMessage}
                </div>
              )}
            </div>

            {/* Test Data Sending from Frontend to Backend via WebSocket */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Test data transmission to remote backend:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSendTestWs}
                  disabled={wsState.status !== 'CONNECTED'}
                  title={wsState.status !== 'CONNECTED' ? 'WebSocket must be connected to send' : 'Send test ping payload'}
                >
                  <Send size={13} />
                  <span>Send Test Ping</span>
                </button>
                <button className="btn btn-sm" onClick={handleTestIngest} title="Simulate packet for offline testing">
                  Simulate Ingest
                </button>
              </div>
            </div>

            {wsSentSuccess && (
              <div style={{ fontSize: '11px', color: 'var(--color-normal)', fontWeight: 600 }}>
                ✓ Test payload sent successfully from frontend over WebSocket.
              </div>
            )}
            {ingestSuccess && (
              <div style={{ fontSize: '11px', color: 'var(--color-normal)', fontWeight: 600 }}>
                ✓ Ingested hardware packet locally. Sensor readouts & AI risk updated in real time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurable Threshold Limits Table */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title">
            <Sliders size={16} color="var(--color-telemetry)" />
            <span>Configurable Prototype Safety Thresholds</span>
          </div>
          <span className="demo-tag">CONFIGURABLE LIMITS</span>
        </div>

        <div className="control-panel-body">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Adjustable alarm trigger levels for underground strata monitoring. Note: These are configurable prototype thresholds and must be calibrated to mine-specific geomechanical conditions.
          </p>

          <table className="industrial-table">
            <thead>
              <tr>
                <th>Telemetry Parameter</th>
                <th>Engineering Unit</th>
                <th>Warning Threshold (Advisory)</th>
                <th>Critical Threshold (Emergency)</th>
                <th>Statutory Baseline Ref.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Borehole Strata Displacement</strong></td>
                <td className="font-mono">mm</td>
                <td>
                  <input
                    type="number"
                    value={dispWarn}
                    onChange={e => setDispWarn(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={dispCrit}
                    onChange={e => setDispCrit(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CMPDI Strata Control Guideline 2018</td>
              </tr>
              <tr>
                <td><strong>Micro-seismic Ground Velocity</strong></td>
                <td className="font-mono">mm/s</td>
                <td>
                  <input
                    type="number"
                    value={vibWarn}
                    onChange={e => setVibWarn(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={vibCrit}
                    onChange={e => setVibCrit(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Triaxial Geophone Acoustic Threshold</td>
              </tr>
              <tr>
                <td><strong>Optical Methane Gas (CH4)</strong></td>
                <td className="font-mono">% Vol</td>
                <td>
                  <input
                    type="number"
                    value={ch4Warn}
                    onChange={e => setCh4Warn(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={ch4Crit}
                    onChange={e => setCh4Crit(e.target.value)}
                    style={{ width: '80px', padding: '4px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
                  />
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coal Mines Regulations (CMR 2017 Reg 169)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardware Telemetry JSON Schema Contract Box */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title">
            <Code size={16} color="var(--color-telemetry)" />
            <span>ESP32 ➔ Jetson Orin Nano ➔ MineGuard Ingestion Contract</span>
          </div>
          <span className="demo-tag">JSON PAYLOAD FORMAT</span>
        </div>
        <div className="control-panel-body" style={{ background: 'var(--bg-panel-elevated)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Physical ESP32 firmware should publish telemetry formatted to this JSON specification via MQTT/REST to the Jetson Orin Nano gateway:
          </p>
          <pre
            style={{
              padding: '14px',
              background: 'var(--bg-app)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#38bdf8',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(samplePacket, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
