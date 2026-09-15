import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Award,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Star,
  Edit3,
  Save,
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  Activity,
  Key,
  BadgeCheck,
  GraduationCap,
  Wrench,
  HardHat,
  Radio,
  Heart,
  Settings,
  FileText,
} from 'lucide-react';
import { playSoundEffect } from '../../services/interactionSound';

export const ProfilePage: React.FC = () => {
  const { userProfile, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...userProfile });
  const [activeSection, setActiveSection] = useState('details');
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditForm({ ...userProfile });
  }, [userProfile]);

  const handleSaveProfile = () => {
    playSoundEffect('save-success');
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({ ...userProfile });
    setPhotoError('');
    setIsEditing(false);
  };

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file in PNG, JPEG, WebP, or GIF format.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setPhotoError('Choose an image smaller than 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (typeof imageData === 'string') {
        setEditForm(current => ({ ...current, photoURL: imageData }));
        setPhotoError('');
      }
    };
    reader.onerror = () => setPhotoError('The image could not be read. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const toggleSkill = (skill: string) => {
    const skills = editForm.skills.includes(skill)
      ? editForm.skills.filter(s => s !== skill)
      : [...editForm.skills, skill];
    setEditForm({ ...editForm, skills });
  };

  const roleColors: Record<string, string> = {
    admin: 'var(--color-critical)',
    operator: 'var(--color-cyan)',
    viewer: 'var(--color-info)',
  };

  const statusColors: Record<string, string> = {
    active: 'var(--color-normal)',
    'on-leave': 'var(--color-warning)',
    offline: 'var(--color-muted)',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    operator: 'Operator',
    viewer: 'Viewer',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    'on-leave': 'On Leave',
    offline: 'Offline',
  };

  const shiftColors: Record<string, string> = {
    'Shift A': '#06b6d4',
    'Shift B': '#f59e0b',
    'Shift C': '#ef4444',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={28} style={{ color: 'var(--color-gold)' }} />
          Operator Profile
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage operator credentials, certifications, and access settings
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-card)' }}>
            {[
              { id: 'details', label: 'Personal Details', icon: <User size={14} /> },
              { id: 'role', label: 'Role & Access', icon: <Key size={14} /> },
              { id: 'certs', label: 'Certifications', icon: <Award size={14} /> },
              { id: 'skills', label: 'Skills', icon: <Wrench size={14} /> },
              { id: 'schedule', label: 'Schedule', icon: <Calendar size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { playSoundEffect('tab-switch'); setActiveSection(tab.id); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSection === tab.id ? 'var(--color-cyan)' : 'transparent',
                  color: activeSection === tab.id ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== DETAILS SECTION ===== */}
          {activeSection === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Personal Info Card */}
              <div className="card">
                <div className="card-title">
                  <span><User size={16} style={{ marginRight: '8px' }} /> Personal Information</span>
                </div>

                {isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-input" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g. Rajesh Kumar" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input type="text" className="form-input" value={editForm.designation}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} placeholder="e.g. Senior Mine Safety Officer" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-input" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="e.g. operator@cmpdi.co.in" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-input" value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="e.g. +91 9876543210" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input type="text" className="form-input" value={editForm.employeeId}
                        onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })} placeholder="e.g. CMPDI-SO-4821" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-input" value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="e.g. Safety & Monitoring" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Assigned Colliery</label>
                      <input type="text" className="form-input" value={editForm.colliery}
                        onChange={(e) => setEditForm({ ...editForm, colliery: e.target.value })} placeholder="e.g. CMPDI Seam-3 Underground Mine" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (Years)</label>
                      <input type="number" className="form-input" value={editForm.experience}
                        onChange={(e) => setEditForm({ ...editForm, experience: parseInt(e.target.value) || 0 })} placeholder="e.g. 12" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emergency Contact Name</label>
                      <input type="text" className="form-input" value={editForm.emergencyContactName}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} placeholder="e.g. Priya Sharma" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Emergency Contact Phone</label>
                      <input type="tel" className="form-input" value={editForm.emergencyContactPhone}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} placeholder="e.g. +91 9876543211" />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { icon: <Mail size={16} />, label: 'Email', value: editForm.email || '—' },
                      { icon: <Phone size={16} />, label: 'Phone', value: editForm.phone || '—' },
                      { icon: <MapPin size={16} />, label: 'Colliery', value: editForm.colliery || '—' },
                      { icon: <User size={16} />, label: 'Designation', value: editForm.designation || '—' },
                      { icon: <BadgeCheck size={16} />, label: 'Employee ID', value: editForm.employeeId || '—' },
                      { icon: <Calendar size={16} />, label: 'Experience', value: `${editForm.experience} years` },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                        <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.icon}
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shift & Status Card */}
              <div className="card">
                <div className="card-title">
                  <span><Clock size={16} style={{ marginRight: '8px' }} /> Shift & Status</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: shiftColors[editForm.shift.split(' ')[0]] || 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <Clock size={20} style={{ color: shiftColors[editForm.shift.split(' ')[0]] || 'var(--color-cyan)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Shift</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{editForm.shift}</div>
                  </div>
                  <div style={{ padding: '16px', background: statusColors[editForm.status] === 'var(--color-normal)' ? 'rgba(16,185,129,0.08)' : statusColors[editForm.status] === 'var(--color-warning)' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${statusColors[editForm.status]}33`, textAlign: 'center' }}>
                    <Activity size={20} style={{ color: statusColors[editForm.status], marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: statusColors[editForm.status], marginTop: '2px' }}>{statusLabels[editForm.status]}</div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <Target size={20} style={{ color: 'var(--color-gold)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Department</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{editForm.department}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== ROLE & ACCESS SECTION ===== */}
          {activeSection === 'role' && (
            <div className="card">
              <div className="card-title">
                <span><Key size={16} style={{ marginRight: '8px' }} /> Role & Access Control</span>
              </div>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}>
                      <option value="admin">Administrator</option>
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}>
                      <option value="active">Active</option>
                      <option value="on-leave">On Leave</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { icon: Shield, label: 'Role', value: roleLabels[editForm.role], color: roleColors[editForm.role] },
                    { icon: Activity, label: 'Status', value: statusLabels[editForm.status], color: statusColors[editForm.status] },
                    { icon: Target, label: 'Access Level', value: editForm.role === 'admin' ? 'Full' : editForm.role === 'operator' ? 'Standard' : 'Read Only', color: roleColors[editForm.role] },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <item.icon size={24} style={{ color: item.color, marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: item.color, marginTop: '4px' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Privilege Grid */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Privileges</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { icon: <Zap size={14} />, label: 'Full Control', granted: editForm.role === 'admin' || editForm.role === 'operator', color: 'var(--color-normal)' },
                    { icon: <AlertCircle size={14} />, label: 'Acknowledge Alerts', granted: true, color: 'var(--color-cyan)' },
                    { icon: <HardHat size={14} />, label: 'Siren Control', granted: editForm.role === 'admin', color: 'var(--color-critical)' },
                    { icon: <Settings size={14} />, label: 'Threshold Config', granted: editForm.role === 'admin', color: 'var(--color-gold)' },
                    { icon: <FileText size={14} />, label: 'Reports Export', granted: true, color: 'var(--color-info)' },
                    { icon: <Radio size={14} />, label: 'System Config', granted: editForm.role === 'admin', color: 'var(--color-cyan)' },
                  ].map((priv, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      {priv.icon}
                      <span style={{ fontSize: '13px', color: priv.granted ? 'var(--text-main)' : 'var(--text-subtle)', flex: 1 }}>{priv.label}</span>
                      {priv.granted ? <CheckCircle2 size={16} style={{ color: priv.color }} /> : <X size={16} style={{ color: 'var(--color-muted)' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== CERTIFICATIONS SECTION ===== */}
          {activeSection === 'certs' && (
            <div className="card">
              <div className="card-title">
                <span><GraduationCap size={16} style={{ marginRight: '8px' }} /> Certifications & Credentials</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { icon: BadgeCheck, title: "First Class Manager's Certificate (Coal)", detail: "DGMS Dhanbad • FCM-COAL-2016/914", valid: true, color: 'var(--color-normal)' },
                  { icon: Shield, title: "Strata Control & Rock Mechanics Specialist", detail: "IIT (ISM) Dhanbad • Advanced Geotechnical", valid: true, color: 'var(--color-cyan)' },
                  { icon: Award, title: "DGMS Safety Officer Certification", detail: "Annual Renewal • Valid until 2026", valid: true, color: 'var(--color-normal)' },
                  { icon: HardHat, title: "Mine Ventilation & Safety Management", detail: "CIMFR Ranchi • Advanced Level", valid: true, color: 'var(--color-gold)' },
                  { icon: Heart, title: "Emergency Response & First Aid", detail: "Red Cross • Certified", valid: true, color: 'var(--color-critical)' },
                ].map((cert, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${cert.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <cert.icon size={20} style={{ color: cert.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{cert.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{cert.detail}</div>
                    </div>
                    {cert.valid && <CheckCircle2 size={18} style={{ color: cert.color, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Add Certification</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Safety Inspector', 'Geotechnical Engineer', 'Fire Safety', 'Environmental Compliance', 'Project Management'].map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${editForm.certifications.includes(skill) ? 'var(--color-cyan)' : 'var(--border-card)'}`,
                          background: editForm.certifications.includes(skill) ? 'rgba(6,182,212,0.1)' : 'transparent',
                          color: editForm.certifications.includes(skill) ? 'var(--color-cyan)' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SKILLS SECTION ===== */}
          {activeSection === 'skills' && (
            <div className="card">
              <div className="card-title">
                <span><Wrench size={16} style={{ marginRight: '8px' }} /> Technical Skills</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['IoT Sensor Networks', 'LoRa/Zigbee Mesh', 'AI/ML Anomaly Detection', 'GIS Mapping', 'ESP32 Programming', 'Prometheus Monitoring', 'Wireless Communication', 'Data Analytics', 'Safety Compliance', 'Remote Monitoring', 'Cloud Sync', 'Edge Computing'].map(skill => (
                  <button
                    key={skill}
                    onClick={() => { playSoundEffect('primary'); toggleSkill(skill); }}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${editForm.skills.includes(skill) ? 'var(--color-cyan)' : 'var(--border-card)'}`,
                      background: editForm.skills.includes(skill) ? 'rgba(6,182,212,0.1)' : 'transparent',
                      color: editForm.skills.includes(skill) ? 'var(--color-cyan)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {skill} {editForm.skills.includes(skill) && <CheckCircle2 size={12} style={{ marginLeft: '4px' }} />}
                  </button>
                ))}
              </div>
              {isEditing && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Skills</div>
                  <input type="text" className="form-input" placeholder="Add custom skill..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !editForm.skills.includes(val)) {
                          setEditForm({ ...editForm, skills: [...editForm.skills, val] });
                        }
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ maxWidth: '250px' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===== SCHEDULE SECTION ===== */}
          {activeSection === 'schedule' && (
            <div className="card">
              <div className="card-title">
                <span><Calendar size={16} style={{ marginRight: '8px' }} /> Shift Schedule</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {['Shift A', 'Shift B', 'Shift C', 'Off Duty'].map((shift, i) => {
                  const isActive = editForm.shift === shift;
                  return (
                    <div key={i} onClick={() => isEditing && setEditForm({ ...editForm, shift: shift })}
                      style={{
                        padding: '16px', borderRadius: '8px', textAlign: 'center', cursor: isEditing ? 'pointer' : 'default',
                        background: isActive ? `${shiftColors[shift]}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? shiftColors[shift] : 'var(--border-subtle)'}`,
                        opacity: shift === 'Off Duty' ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}>
                      <Clock size={18} style={{ color: shiftColors[shift] || 'var(--color-muted)', marginBottom: '6px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{shift}</div>
                      {isActive && <CheckCircle2 size={14} style={{ color: shiftColors[shift], marginTop: '4px' }} />}
                    </div>
                  );
                })}
              </div>
              {/* Weekly Grid */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Weekly Schedule</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{day}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: i < 5 ? 'var(--color-cyan)' : 'var(--color-muted)', marginTop: '2px' }}>
                        {i < 5 ? editForm.shift.split(' ')[0] : 'Off'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>

          {/* Avatar Card */}
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-gold) 100%)',
                border: '3px solid var(--color-cyan)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 0 24px rgba(6, 182, 212, 0.3)',
                overflow: 'hidden',
              }}>
                {editForm.photoURL ? (
                  <img src={editForm.photoURL} alt={editForm.name || 'Administrator profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={40} color="#fff" />
                )}
              </div>
              {isEditing && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handlePhotoSelection}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    aria-label="Choose profile picture"
                    title="Choose profile picture"
                    style={{
                      position: 'absolute', bottom: '0', right: '0',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'var(--color-cyan)', border: '2px solid var(--bg-app)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff',
                    }}
                    onClick={() => { playSoundEffect('primary'); photoInputRef.current?.click(); }}
                  >
                    <Camera size={14} />
                  </button>
                </>
              )}
            </div>
            {isEditing && (
              <div style={{ margin: '0 auto 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPEG, WebP, or GIF · up to 1 MB</span>
                {editForm.photoURL && (
                  <button type="button" className="btn btn-sm" onClick={() => setEditForm(current => ({ ...current, photoURL: undefined }))}>
                    <X size={12} /> Remove photo
                  </button>
                )}
                {photoError && <span role="alert" style={{ fontSize: '11px', color: 'var(--color-critical)' }}>{photoError}</span>}
              </div>
            )}

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{editForm.name || 'Operator'}</h2>
            <div style={{ fontSize: '13px', color: 'var(--color-cyan)', fontWeight: 600, marginTop: '2px' }}>{editForm.designation}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{editForm.employeeId || '—'}</div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: `${statusColors[editForm.status]}15`, color: statusColors[editForm.status],
                border: `1px solid ${statusColors[editForm.status]}33`,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle2 size={12} />
                {statusLabels[editForm.status]}
              </span>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: `${roleColors[editForm.role]}15`, color: roleColors[editForm.role],
                border: `1px solid ${roleColors[editForm.role]}33`,
              }}>
                {roleLabels[editForm.role]}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-title">
              <span><Star size={16} style={{ marginRight: '8px' }} /> Performance</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { label: 'Alerts Ack.', value: '142', icon: AlertCircle, color: 'var(--color-normal)' },
                { label: 'Drills Led', value: '18', icon: Target, color: 'var(--color-cyan)' },
                { label: 'Incidents', value: '3', icon: Activity, color: 'var(--color-warning)' },
                { label: 'Uptime %', value: '99.7', icon: Zap, color: 'var(--color-gold)' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing ? (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { playSoundEffect('primary'); setIsEditing(true); }}>
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
