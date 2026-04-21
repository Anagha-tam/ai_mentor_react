import { PrimaryBtn, TextInput, loginStyles } from "../ui/authUi.jsx";

export function AdminLoginPage({
  adminEmail,
  adminPassword,
  adminError,
  onAdminEmailChange,
  onAdminPasswordChange,
  onSubmit,
}) {
  return (
    <main className="auth-shell">
      <section className="auth-left">
      <section className="auth-card" style={loginStyles.panel}>
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
        <form style={loginStyles.panelBody} onSubmit={onSubmit}>
          <span style={loginStyles.fieldLabel}>Admin email</span>
          <TextInput
            type="email"
            value={adminEmail}
            onChange={onAdminEmailChange}
            placeholder="admin@company.com"
            autoFocus
          />
          <span style={{ ...loginStyles.fieldLabel, marginTop: "14px" }}>Password</span>
          <TextInput
            type="password"
            value={adminPassword}
            onChange={onAdminPasswordChange}
            placeholder="Enter password"
          />
          <PrimaryBtn type="submit">Sign in to Admin</PrimaryBtn>
          {adminError ? <p className="error">{adminError}</p> : null}
        </form>
      </section>
      </section>
      <aside className="auth-right">
        <div className="auth-right-content">
          <h2>Admin Console</h2>
          <p>Track candidate mentoring sessions, attendance, and progress insights.</p>
        </div>
      </aside>
    </main>
  );
}
