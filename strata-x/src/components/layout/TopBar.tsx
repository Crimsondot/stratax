import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Shield, Radio, Bell } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeAlertsCount,
    onlineNodesCount,
    nodes,
    alerts,
    overallStatus,
    theme,
    toggleTheme,
    simulationState,
    setActiveTab,
  } = useApp();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  const sysStatusLabel =
    overallStatus === 'CRITICAL'  ? 'CRITICAL ALERT'
    : overallStatus === 'HIGH_RISK' ? 'HIGH RISK'
    : overallStatus === 'WARNING'   ? 'WARNING'
    : 'OPERATIONAL';

  const sysStatusColor =
    overallStatus === 'CRITICAL'  ? 'var(--color-critical)'
    : overallStatus === 'HIGH_RISK' ? 'var(--color-high-risk)'
    : overallStatus === 'WARNING'   ? 'var(--color-warning)'
    : 'var(--color-normal)';

  return (
    <header className="app-topbar" role="banner" aria-label="Mineral Sentinel System Status">
      {/* Brand identity matching reference screenshot */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, cursor: 'pointer' }}
        onClick={() => setActiveTab('command-center')}
        title="Go to Live Map Dashboard"
      >
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #2665fd, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(38,101,253,0.3)',
        }}>
          <Shield size={16} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5, color: 'var(--text-bright)' }}>
            MINERAL SENTINEL
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            | Mine Subsidence System
          </span>
        </div>
      </div>

      {/* System Status Chips - Interactive Navigation Buttons */}
      <div className="topbar-chips" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {/* Status pill with glowing dot -> navigates to Prediction */}
        <button
          onClick={() => setActiveTab('prediction')}
          title="Click to view AI Prediction & Risk Status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'var(--bg-chip)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: sysStatusColor,
              boxShadow: `0 0 8px ${sysStatusColor}`,
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>SYSTEM STATUS:</span>
          <span style={{ color: sysStatusColor }}>{sysStatusLabel}</span>
        </button>

        {/* Total Nodes pill -> navigates to Nodes Page */}
        <button
          onClick={() => setActiveTab('nodes')}
          title="Click to view Sensor Nodes Network"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'var(--bg-chip)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <Radio size={12} style={{ color: 'var(--color-primary)' }} />
          <span>TOTAL NODES:</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 700 }}>
            {nodes.length > 0 ? nodes.length : 128}
          </span>
        </button>

        {/* Active alerts chip -> navigates to Alerts Page */}
        <button
          onClick={() => setActiveTab('alerts')}
          title="Click to view Active Alerts & Notifications"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: activeAlertsCount > 0 ? 'rgba(255,68,68,0.08)' : 'var(--bg-chip)',
            border: activeAlertsCount > 0 ? '1px solid rgba(255,68,68,0.3)' : '1px solid var(--border-subtle)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Bell size={12} style={{ color: activeAlertsCount > 0 ? 'var(--color-critical)' : 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>ACTIVE ALERTS:</span>
          <span style={{
            color: activeAlertsCount > 0 ? 'var(--color-critical)' : 'var(--color-normal)',
            fontWeight: 700,
          }}>
            {activeAlertsCount} {criticalCount > 0 ? `(${criticalCount} CRITICAL)` : ''}
          </span>
        </button>

        {/* Drill status if active */}
        {simulationState.isActive && (
          <div style={{
            padding: '4px 10px',
            borderRadius: 4,
            background: 'rgba(255,68,68,0.15)',
            border: '1px solid var(--color-critical)',
            color: 'var(--color-critical)',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            animation: 'pulse-slow 1.2s infinite',
          }}>
            DRILL: {simulationState.stage}
          </div>
        )}
      </div>

      {/* Right controls: Theme Switch + Date/Time + User Profile */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Sun / Moon Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '5px 9px',
            borderRadius: 6,
            background: 'var(--bg-chip)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          aria-label="Toggle Color Theme"
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} style={{ color: '#2665fd' }} />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={14} style={{ color: '#f59e0b' }} />
              <span>Light</span>
            </>
          )}
        </button>

        {/* Date & Time */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-bright)' }}>
            {timeStr}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
            {dateStr}
          </div>
        </div>

        {/* User avatar */}
        <div
          onClick={() => setActiveTab('profile')}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border: '2px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: '#fff',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Mining Safety Officer — Click to view Profile"
        >
          SO
        </div>
      </div>
    </header>
  );
};
