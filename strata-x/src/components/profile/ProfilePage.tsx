import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Award,
  Key,
  Bell,
  Clock,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { config } = useApp();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <User size={22} color="var(--color-telemetry)" />
            <span>Control Room Operator & Safety Officer Profile</span>
          </h1>
          <p>
            Statutory Personnel Credentials • Role-Based Access Control • Active Shift Assignment
          </p>
        </div>
      </div>

      <div className="grid-1-2">
        {/* Left Profile Card */}
        <div className="control-panel" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #1e293b 100%)',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <User size={40} color="#ffffff" />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-bright)' }}>
            A. K. Sengupta
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--color-telemetry)', fontWeight: 600, marginTop: '2px' }}>
            Senior Mine Safety Officer
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Employee ID: <span className="font-mono">CMPDI-SO-4821</span>
          </div>

          <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span className="status-badge status-normal" style={{ fontSize: '10px' }}>
              ✓ ACTIVE ON DUTY
            </span>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'left', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Colliery:</span>
              <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{config.mineName}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Active Shift:</span>
              <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{config.activeShift}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
              <div className="font-mono" style={{ color: 'var(--text-bright)' }}>+91 (0341) 252-8812</div>
            </div>
          </div>
        </div>

        {/* Right Details: Certifications, Roles, and Shift Handover Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Statutory Certifications */}
          <div className="control-panel">
            <div className="control-panel-header">
              <div className="control-panel-title">
                <Award size={16} color="var(--color-telemetry)" />
                <span>Statutory Mining Engineering Credentials</span>
              </div>
            </div>
            <div className="control-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-app)', borderRadius: '4px' }}>
                <FileCheck size={20} color="var(--color-normal)" />
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-bright)' }}>
                    First Class Manager's Certificate of Competency (Coal)
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    DGMS Dhanbad Certificate No: FCM-COAL-2016/914 • Validity: Permanent
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-app)', borderRadius: '4px' }}>
                <Shield size={20} color="var(--color-telemetry)" />
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-bright)' }}>
                    Strata Control & Rock Mechanics Specialist Certification
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Indian Institute of Technology (ISM) Dhanbad • Advanced Geotechnical Monitoring
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Control Role & Permissions */}
          <div className="control-panel">
            <div className="control-panel-header">
              <div className="control-panel-title">
                <Key size={16} color="var(--color-telemetry)" />
                <span>MineGuard Platform Access Level & Privileges</span>
              </div>
            </div>
            <div className="control-panel-body">
              <div className="grid-3" style={{ gap: '10px' }}>
                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Role</div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-bright)' }}>Safety Officer</strong>
                  <div style={{ fontSize: '10px', color: 'var(--color-normal)', marginTop: '4px' }}>Full Control & Acknowledge</div>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evacuation Authority</div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-critical)' }}>Level 1 Trigger</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Authorized for sirens</div>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Threshold Config</div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-telemetry)' }}>Write Access</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Calibrate edge models</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
