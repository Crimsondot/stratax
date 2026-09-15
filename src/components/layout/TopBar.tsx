import React, { useEffect, useState } from 'react';
import { Bell, Radio, Wifi } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playSoundEffect, playSealHoverSound } from '../../services/interactionSound';

export const TopBar: React.FC = () => {
  const { activeAlertsCount, nodes, alerts, overallStatus, simulationState, setActiveTab, wsState, config, reconnectWs, userProfile } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const criticalCount = alerts.filter(alert => alert.severity === 'CRITICAL' && alert.status === 'ACTIVE').length;
  const status = overallStatus === 'CRITICAL' ? 'Critical alert' : overallStatus === 'HIGH_RISK' ? 'High risk' : overallStatus === 'WARNING' ? 'Warning' : 'Operational';
  const statusTone = overallStatus === 'CRITICAL' ? 'critical' : overallStatus === 'HIGH_RISK' ? 'risk' : overallStatus === 'WARNING' ? 'warning' : 'normal';
  const wsConnected = wsState.status === 'CONNECTED';

  return (
    <header className="app-topbar" role="banner" aria-label="Mineral Sentinel System Status">
      <button className="topbar-wordmark" onClick={() => setActiveTab('command-center')}>
        <span className="topbar-eyebrow">Mine safety intelligence</span>
        <span className="topbar-title">Mineral Sentinel</span>
      </button>
      <div className="topbar-divider" aria-hidden="true" />
      <div className="topbar-context">Operations command center</div>

      <div className="topbar-metrics" aria-label="Current system metrics">
        <button className={`topbar-status status-${statusTone}`} onClick={() => setActiveTab('prediction')}>
          <span className="status-indicator" /><span>System</span><strong>{status}</strong>
        </button>
        <button className="topbar-metric" onClick={() => setActiveTab('nodes')}><Radio size={13} /><span>Nodes</span><strong>{nodes.length || 128}</strong></button>
        <button className={`topbar-metric ${activeAlertsCount ? 'has-alerts' : ''}`} onClick={() => setActiveTab('alerts')}>
          <Bell size={13} /><span>Alerts</span><strong>{activeAlertsCount}</strong>{criticalCount > 0 && <em>{criticalCount} critical</em>}
        </button>
        {config.dataSource === 'REMOTE_WEBSOCKET' && (
          <button className={`topbar-connection ${wsConnected ? 'connected' : ''}`} onClick={() => (wsConnected ? setActiveTab('settings') : reconnectWs())} title={wsConnected ? 'Open connection settings' : 'Reconnect data source'}>
            <Wifi size={13} /><span>{wsConnected ? 'Live feed' : 'Feed offline'}</span>
          </button>
        )}
      </div>
      {simulationState.isActive && <div className="topbar-drill">Drill · {simulationState.stage}</div>}

      <div className="topbar-actions">
        <time className="topbar-clock">
          <strong>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
          <span>{now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </time>
        <button className={`operator-avatar ${userProfile.photoURL ? 'has-photo' : ''}`} onClick={() => { playSoundEffect('nav'); setActiveTab('profile'); }} title="Open operator profile">
          {userProfile.photoURL ? <img src={userProfile.photoURL} alt="Open operator profile" /> : (userProfile.name.trim().match(/\b\w/g)?.slice(0, 2).join('').toUpperCase() || 'OP')}
        </button>
        
        {/* Enlarged 4x Institutional Seal with Visually Striking Animations & Sound Effects */}
        <div
          className="institutional-seal enlarged-seal"
          title="Institutional Seal — Click for ceremonial audio feedback"
          onClick={() => playSoundEffect('seal')}
          onMouseEnter={() => playSealHoverSound()}
        >
          <div className="seal-aura-ring" />
          <img src="/institutional-seal.png" alt="Institutional Seal" />
        </div>
      </div>
    </header>
  );
};
