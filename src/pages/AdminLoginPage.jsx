import { useState } from 'react';
import { adminLogin } from '../Services/api';
import { PrimaryBtn, TextInput, loginStyles } from '../components/ui/authUi.jsx';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = await adminLogin({ email, password });
      const token = payload?.token || payload?.data?.token || '';
      if (!token) throw new Error('No token received from server.');
      onLoginSuccess(token);
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={loginStyles.scene}>
      <section style={loginStyles.panel}>
        <div style={loginStyles.panelTop}>
          <div style={loginStyles.brandMark}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M2 8l10 6 10-6" />
            </svg>
          </div>
          <p style={loginStyles.topTitle}>Admin Sign In</p>
          <p style={loginStyles.topSub}>Use admin credentials to access AI mentor analytics.</p>
        </div>
        <form style={loginStyles.panelBody} onSubmit={handleSubmit}>
          <span style={loginStyles.fieldLabel}>Admin email</span>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@company.com"
            autoFocus
          />
          <span style={{ ...loginStyles.fieldLabel, marginTop: '14px' }}>Password</span>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <PrimaryBtn type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in to Admin'}
          </PrimaryBtn>
          {error && (
            <p style={{ color: '#e24b4a', fontSize: '13px', marginTop: '12px', margin: '12px 0 0' }}>
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
