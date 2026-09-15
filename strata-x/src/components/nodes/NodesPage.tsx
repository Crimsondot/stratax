import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { NodeService } from '../../services/nodeService';
import {
  Cpu,
  Radio,
  BatteryCharging,
  Wifi,
  Activity,
  Plus,
  Server,
  HardDrive,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { SensorNode } from '../../types';

export const NodesPage: React.FC = () => {
  const { nodes, sensors, setSelectedNodeId, setSelectedSensorId, setActiveTab } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // New Node Form State (for demonstration of adding nodes later)
  const [newNodeId, setNewNodeId] = useState('NODE-03');
  const [newNodeName, setNewNodeName] = useState('ESP32 Gateway Node 03');
  const [newNodeZone, setNewNodeZone] = useState('ZONE-RETURN-02');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Cpu size={22} color="var(--color-telemetry)" />
            <span>ESP32 Edge Sensor Nodes Management</span>
          </h1>
          <p>
            Hardware Fleet Telemetry • RS485 / WiFi Mesh Ingestion to NVIDIA Jetson Orin Nano Edge Gateway
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            <span>Register ESP32 Node</span>
          </button>
        </div>
      </div>

      {/* Node Fleet Cards Grid */}
      <div className="grid-2">
        {nodes.map(node => {
          const nodeSensors = sensors.filter(s => s.nodeId === node.id);
          const signalInfo = NodeService.getSignalQuality(node.signalStrength);
          const batteryInfo = NodeService.getBatteryStatus(node.batteryVoltage, node.batteryPercent);

          return (
            <div key={node.id} className="control-panel">
              <div className="control-panel-header">
                <div className="control-panel-title">
                  <Radio size={16} color="var(--color-telemetry)" />
                  <span className="font-mono">{node.id}</span>
                  <span style={{ color: 'var(--text-bright)', fontWeight: 600, textTransform: 'none' }}>
                    — {node.name}
                  </span>
                </div>
                <StatusBadge status={node.status} size="sm" />
              </div>

              <div className="control-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Location and Gateway Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Mine Zone</div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-bright)' }}>{node.zoneName}</strong>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Zone ID: {node.zoneId}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Edge Gateway Host</div>
                    <strong className="font-mono" style={{ fontSize: '13px', color: 'var(--color-telemetry)' }}>
                      {node.gatewayId}
                    </strong>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      IP: {node.ipAddress}
                    </div>
                  </div>
                </div>

                {/* 4 Hardware Metrics Bars */}
                <div className="grid-4" style={{ gap: '10px' }}>
                  {/* Signal Strength */}
                  <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>RF Signal</span>
                      <Wifi size={12} color={signalInfo.color} />
                    </div>
                    <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
                      {node.signalStrength} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>dBm</span>
                    </div>
                    <div style={{ fontSize: '10px', color: signalInfo.color, marginTop: '2px', fontWeight: 600 }}>
                      {signalInfo.label} ({signalInfo.bars}/4 bars)
                    </div>
                  </div>

                  {/* Battery Voltage & Percent */}
                  <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>Battery Pack</span>
                      <BatteryCharging size={12} color={batteryInfo.color} />
                    </div>
                    <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
                      {node.batteryPercent}%
                    </div>
                    <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {node.batteryVoltage} V (LiFePO4)
                    </div>
                  </div>

                  {/* Node Health */}
                  <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>Device Health</span>
                      <Activity size={12} color="var(--color-normal)" />
                    </div>
                    <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-normal)', marginTop: '2px' }}>
                      {node.health}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      MCU Normal
                    </div>
                  </div>

                  {/* Last Communication */}
                  <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>Last Ingest</span>
                      <Clock size={12} color="var(--color-telemetry)" />
                    </div>
                    <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
                      {Math.max(1, Math.round((Date.now() - node.lastCommunication) / 1000))}s ago
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {node.dataRate}
                    </div>
                  </div>
                </div>

                {/* Connected Sensors Telemetry Strip */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Connected Instruments ({nodeSensors.length} / 6 Channels)
                    </span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      MCU: {node.model}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {nodeSensors.map(sensor => (
                      <div
                        key={sensor.id}
                        style={{
                          background: 'var(--bg-app)',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedSensorId(sensor.id);
                          setActiveTab('sensors');
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-bright)' }}>
                            {sensor.name.split(' ')[0]}
                          </span>
                          <StatusBadge status={sensor.status} size="sm" />
                        </div>
                        <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, marginTop: '3px', color: 'var(--text-bright)' }}>
                          {sensor.currentValue} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sensor.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setActiveTab('mine-map');
                    }}
                  >
                    <span>View on GIS Map</span>
                    <ChevronRight size={13} />
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setActiveTab('sensors');
                    }}
                  >
                    <span>Inspect Sensors</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register New Node (demonstrates multi-node architectural readiness) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Register New ESP32 Sensor Node</h3>
              <button className="btn btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Configure a new ESP32 edge microcontroller node to ingest multi-channel strata telemetry into the Jetson Orin Nano gateway.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Node Identifier
                </label>
                <input
                  type="text"
                  value={newNodeId}
                  onChange={e => setNewNodeId(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Node Display Name
                </label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={e => setNewNodeName(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Assigned Mine Monitoring Zone
                </label>
                <select
                  value={newNodeZone}
                  onChange={e => setNewNodeZone(e.target.value)}
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
                  <option value="ZONE-P4B">Panel 4B Tailgate Roadway</option>
                  <option value="ZONE-P4A">Panel 4A Main Gate Conveyor</option>
                  <option value="ZONE-RETURN-02">South Return Airway Cross-cut</option>
                  <option value="ZONE-INTAKE-01">Main Intake Trunk Roadway</option>
                </select>
              </div>

              <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '10px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>Architecture Note:</strong> Once registered, ESP32 nodes broadcast via RS485 or WiFi UDP/MQTT packets directly to the Jetson Orin Nano ingestion port.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(`Node ${newNodeId} provisioned in system directory. Connect ESP32 payload to gateway URL.`);
                  setShowAddModal(false);
                }}
              >
                Register & Provision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
