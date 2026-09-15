import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { SensorDetailModal } from './SensorDetailModal';
import {
  Activity,
  Search,
  Filter,
  ArrowUpDown,
  Sliders,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Sensor } from '../../types';

export const SensorsPage: React.FC = () => {
  const { sensors, selectedSensorId, setSelectedSensorId } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortField, setSortField] = useState<'id' | 'name' | 'value' | 'rate' | 'risk'>('risk');
  const [sortAsc, setSortAsc] = useState(false);

  const [modalSensor, setModalSensor] = useState<Sensor | null>(null);

  // Sync with context selectedSensorId if open
  React.useEffect(() => {
    if (selectedSensorId) {
      const match = sensors.find(s => s.id === selectedSensorId);
      if (match) setModalSensor(match);
    }
  }, [selectedSensorId, sensors]);

  const filteredSensors = useMemo(() => {
    return sensors.filter(s => {
      if (filterZone !== 'ALL' && s.zoneId !== filterZone) return false;
      if (filterType !== 'ALL' && s.type !== filterType) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.nodeId.toLowerCase().includes(q) ||
          s.zoneId.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') comparison = a.id.localeCompare(b.id);
      else if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'value') comparison = a.currentValue - b.currentValue;
      else if (sortField === 'rate') comparison = a.rateOfChange - b.rateOfChange;
      else if (sortField === 'risk') comparison = a.aiContribution - b.aiContribution;
      return sortAsc ? comparison : -comparison;
    });
  }, [sensors, filterZone, filterType, filterStatus, searchTerm, sortField, sortAsc]);

  const handleSort = (field: 'id' | 'name' | 'value' | 'rate' | 'risk') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Activity size={22} color="var(--color-telemetry)" />
            <span>Master Sensor Telemetry Inventory</span>
          </h1>
          <p>
            Real-Time Stream across 2 ESP32 Mesh Nodes • Strata Extensometers, Micro-seismic Geophones & Gas Telemetry
          </p>
        </div>
        <div className="header-actions">
          <span className="demo-tag">{sensors.length} SENSORS CONFIGURED</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="control-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-app)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search sensor ID, type, zone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            <option value="ALL">All Zones</option>
            <option value="ZONE-P4B">Panel 4B Tailgate</option>
            <option value="ZONE-P4A">Panel 4A Main Gate</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="displacement">Displacement</option>
            <option value="displacement_rate">Displacement Rate</option>
            <option value="vibration">Vibration</option>
            <option value="methane">Methane (CH4)</option>
            <option value="carbon_monoxide">Carbon Monoxide (CO)</option>
            <option value="temperature">Temperature</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Warning</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredSensors.length}</strong> of {sensors.length} sensors
        </div>
      </div>

      {/* Main Sensors Table */}
      <div className="control-panel">
        <div style={{ overflowX: 'auto' }}>
          <table className="industrial-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Sensor ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Sensor Name & Type</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Host Node</th>
                <th>Monitored Zone</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('value')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Current Value</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rate')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Rate of Change</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Threshold Limit</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('risk')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>AI Contribution</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSensors.map(sensor => (
                <tr
                  key={sensor.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setModalSensor(sensor);
                    setSelectedSensorId(sensor.id);
                  }}
                >
                  <td className="font-mono font-bold" style={{ color: 'var(--color-telemetry)' }}>
                    {sensor.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{sensor.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {sensor.type.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="font-mono">{sensor.nodeId}</td>
                  <td>{sensor.zoneId}</td>
                  <td>
                    <span className="font-mono font-bold" style={{ fontSize: '15px', color: 'var(--text-bright)' }}>
                      {sensor.currentValue}
                    </span>{' '}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sensor.unit}</span>
                  </td>
                  <td className="font-mono">
                    <span style={{ color: sensor.rateOfChange > 1.0 ? 'var(--color-high-risk)' : 'var(--text-secondary)' }}>
                      {sensor.rateOfChange} {sensor.unit}/hr
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    W: {sensor.warningThreshold} | C: {sensor.criticalThreshold}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono font-bold" style={{ color: 'var(--color-purple)' }}>
                        {sensor.aiContribution}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={sensor.status} size="sm" />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        setModalSensor(sensor);
                        setSelectedSensorId(sensor.id);
                      }}
                    >
                      <span>Inspect</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensor Detail Inspector Modal */}
      {modalSensor && (
        <SensorDetailModal
          sensor={modalSensor}
          onClose={() => {
            setModalSensor(null);
            setSelectedSensorId(null);
          }}
        />
      )}
    </div>
  );
};
