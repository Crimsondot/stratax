import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { playSoundEffect } from '../../services/interactionSound';
import {
  LayoutDashboard,
  Map,
  Cpu,
  Activity,
  Brain,
  AlertTriangle,
  BarChart2,
  FileText,
  Settings,
  User,
  Wifi,
  AlertOctagon,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  items: NavItem[];
  divider?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeAlertsCount, simulationState } = useApp();

  const sections: NavSection[] = [
    {
      items: [
        { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard size={17} /> },
        { id: 'mine-map',       label: 'Live GIS Map',   icon: <Map size={17} /> },
        { id: 'nodes',          label: 'Sensor Nodes',   icon: <Cpu size={17} /> },
        { id: 'sensors',        label: 'Sensor Telemetry', icon: <Activity size={17} /> },
        { id: 'prediction',     label: 'AI Prediction',  icon: <Brain size={17} /> },
        {
          id: 'alerts',
          label: 'Alert Management',
          icon: <AlertTriangle size={17} />,
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        },
      ],
    },
    {
      divider: true,
      items: [
        { id: 'analytics', label: 'Multi-Sensor Analytics', icon: <BarChart2 size={17} /> },
        { id: 'reports',   label: 'Safety Reports',         icon: <FileText size={17} /> },
      ],
    },
    {
      divider: true,
      items: [
        { id: 'settings', label: 'Settings & Ingest',  icon: <Settings size={17} /> },
        { id: 'profile',  label: 'Operator Profile',   icon: <User size={17} /> },
      ],
    },
  ];

  return (
    <aside className="app-sidebar" role="navigation" aria-label="Mineral Sentinel Navigation">
      {/* Brand Badge & Expandable Title */}
      <div
        className="sidebar-brand"
        onClick={() => setActiveTab('command-center')}
        title="Mineral Sentinel — Mine Subsidence System"
      >
        <img
          className="sidebar-brand-logo"
          src="/mineral-sentinel-logo.png"
          alt="Mineral Sentinel"
        />
      </div>

      {/* Navigation Rail with Expandable Labels */}
      <nav className="sidebar-rail-nav">
        {sections.map((section, sIdx) => (
          <React.Fragment key={sIdx}>
            {section.divider && <div className="sidebar-divider" aria-hidden="true" />}
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-rail-item${activeTab === item.id ? ' active' : ''}`}
                onClick={() => { playSoundEffect('tab-switch'); setActiveTab(item.id); }}
                title={item.label}
                aria-label={item.label}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span className="rail-icon">{item.icon}</span>
                <span className="rail-item-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rail-badge" aria-label={`${item.badge} active alerts`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer: system status indicators with expandable labels */}
      <div className="sidebar-rail-footer">
        {simulationState.isActive && (
          <div
            className="sidebar-rail-item"
            style={{ color: 'var(--color-critical)', animation: 'pulse-slow 1.5s infinite' }}
            title={`⚠ SAFETY DRILL ACTIVE — Stage: ${simulationState.stage}`}
            aria-label={`Safety drill active: stage ${simulationState.stage}`}
          >
            <span className="rail-icon"><AlertOctagon size={16} /></span>
            <span className="rail-item-label" style={{ color: 'var(--color-critical)' }}>
              Drill: {simulationState.stage}
            </span>
          </div>
        )}
        <div
          className="sidebar-rail-item"
          style={{ cursor: 'default' }}
          title="Gateway: ONLINE — Jetson Orin Nano"
          aria-label="Gateway online"
        >
          <span className="rail-icon"><Wifi size={15} style={{ color: 'var(--color-normal)' }} /></span>
          <span className="rail-item-label" style={{ color: 'var(--text-muted)' }}>
            Gateway: Online
          </span>
        </div>
      </div>
    </aside>
  );
};
