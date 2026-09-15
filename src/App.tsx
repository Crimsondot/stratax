import React, { useEffect, useState } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandCenter } from './components/command-center/CommandCenter';
import { MineMap } from './components/map/MineMap';
import { NodesPage } from './components/nodes/NodesPage';
import { SensorsPage } from './components/sensors/SensorsPage';
import { PredictionPage } from './components/prediction/PredictionPage';
import { AlertsPage } from './components/alerts/AlertsPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { SimulationController } from './components/simulation/SimulationController';
import { LoginPage } from './components/auth/LoginPage';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { enableInteractionSounds } from './services/interactionSound';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Determine if Clerk should be used: must be a valid publishable key
const USE_CLERK = PUBLISHABLE_KEY && PUBLISHABLE_KEY.startsWith('pk_') && PUBLISHABLE_KEY.length > 30;

const DashboardContent: React.FC = () => {
  const { activeTab, simulationState } = useApp();
  const [showSimController, setShowSimController] = React.useState(false);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="app-main">
        <TopBar />
        {activeTab === 'command-center' && <CommandCenter />}
        {activeTab !== 'command-center' && (
          <div className="app-content">
            {activeTab === 'mine-map'    && <MineMap />}
            {activeTab === 'nodes'       && <NodesPage />}
            {activeTab === 'sensors'     && <SensorsPage />}
            {activeTab === 'prediction'  && <PredictionPage />}
            {activeTab === 'alerts'      && <AlertsPage />}
            {activeTab === 'analytics'   && <AnalyticsPage />}
            {activeTab === 'reports'     && <ReportsPage />}
            {activeTab === 'settings'    && <SettingsPage />}
            {activeTab === 'profile'     && <ProfilePage />}
          </div>
        )}
        <button
          className={`btn ${simulationState.isActive ? 'btn-danger' : 'btn-warning'}`}
          style={{
            position: 'fixed',
            bottom: activeTab === 'command-center' ? '60px' : '20px',
            right: '16px',
            zIndex: 850,
            fontSize: 11,
            padding: '6px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onClick={() => setShowSimController(prev => !prev)}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <AlertTriangle size={13} />
          <span>
            {showSimController ? 'Hide Controller' : simulationState.isActive ? `Drill: ${simulationState.stage}` : 'Safety Drill'}
          </span>
        </button>
        {(showSimController || simulationState.isActive) && (
          <SimulationController onClose={() => setShowSimController(false)} />
        )}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-pitch-black)', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
      }}>
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
};

export default function App() {
  useEffect(() => { enableInteractionSounds(); }, []);

  if (!PUBLISHABLE_KEY) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-pitch-black)', color: 'var(--color-critical)', fontFamily: 'var(--font-sans)',
        flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Mineral Sentinel</h1>
        <p>Missing Clerk Publishable Key</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Set VITE_CLERK_PUBLISHABLE_KEY in your .env file.
        </p>
        <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
          Get your Clerk API keys
        </a>
      </div>
    );
  }

  // If we have a publishable key but decide not to use Clerk (invalid placeholder), render content directly
  if (!USE_CLERK) {
    return (
      <AppProvider>
        <DashboardContent />
      </AppProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
    >
      <AppContent />
    </ClerkProvider>
  );
}
