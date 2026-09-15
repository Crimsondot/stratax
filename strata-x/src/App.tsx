import React, { useState } from 'react';
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
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, simulationState } = useApp();
  const [showSimController, setShowSimController] = useState(false);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="app-main">
        <TopBar />

        {/* Command Center: full-height, no scroll wrapper */}
        {activeTab === 'command-center' && <CommandCenter />}

        {/* All other pages: scrollable content area */}
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

        {/* Floating Safety Drill Controller */}
        <button
          className={`btn ${simulationState.isActive ? 'btn-danger' : 'btn-warning'}`}
          style={{
            position: 'fixed',
            bottom: activeTab === 'command-center' ? '60px' : '20px',
            right: '16px',
            zIndex: 850,
            fontSize: 11,
            padding: '6px 12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowSimController(prev => !prev)}
        >
          <AlertTriangle size={13} />
          <span>
            {showSimController
              ? 'Hide Controller'
              : simulationState.isActive
              ? `Drill: ${simulationState.stage}`
              : 'Safety Drill'}
          </span>
        </button>

        {(showSimController || simulationState.isActive) && (
          <SimulationController onClose={() => setShowSimController(false)} />
        )}
      </main>
    </div>
  );

};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
