import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const LoginPage: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-pitch-black)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        width: 420,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 900,
            color: '#fff',
          }}>
            MS
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
            Mineral Sentinel
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Mine Safety Intelligence Platform
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: { background: 'transparent', boxShadow: 'none', border: 'none' },
              formButtonPrimary: {
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 6,
                padding: '10px 16px',
              },
              formFieldInput: {
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
                color: 'var(--text-bright)',
                padding: '10px 12px',
              },
              formLabel: { color: 'var(--text-muted)', fontWeight: 700, fontSize: 11 },
              footerActionLink: { color: 'var(--color-primary)' },
              headerTitle: { color: 'var(--text-bright)', fontSize: 18 },
              headerSubtitle: { color: 'var(--text-muted)' },
              dividerText: { color: 'var(--text-muted)' },
              socialButtonsBlockButton: {
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-bright)',
                borderRadius: 4,
              },
            },
          }}
          afterSignInUrl="/"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
};
