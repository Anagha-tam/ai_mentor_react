import { PrimaryBtn, StepPip, TextInput, loginStyles } from "../ui/authUi.jsx";

export function CandidateLoginPage(props) {
  const {
    authMode,
    loginEmail,
    loginPassword,
    registerFirstName,
    registerLastName,
    registerEmail,
    registerPhone,
    registerClass,
    registerStream,
    registerPassword,
    socketError,
    authLoading,
    onSwitchMode,
    onLoginEmailChange,
    onLoginPasswordChange,
    onRegisterFirstNameChange,
    onRegisterLastNameChange,
    onRegisterEmailChange,
    onRegisterPhoneChange,
    onRegisterClassChange,
    onRegisterStreamChange,
    onRegisterPasswordChange,
    onSubmitLogin,
    onSubmitRegister,
  } = props;

  const isLogin = authMode === "login";
  const stepConfig = isLogin
    ? {
        title: "Welcome back",
        sub: "Sign in to continue your AI mentor session.",
        pip: [true, false, false],
      }
    : {
        title: "Create account",
        sub: "Register once to start guided interview preparation.",
        pip: [false, true, false],
      };

  return (
    <main className="auth-shell">
      <section className="auth-left">
        <div className="auth-card">
          <div style={loginStyles.panelTop}>
            <div style={loginStyles.brandMark}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 8l10 6 10-6" />
              </svg>
            </div>
            <p style={loginStyles.topTitle}>{stepConfig.title}</p>
            <p style={loginStyles.topSub}>{stepConfig.sub}</p>
            <div style={loginStyles.stepsRow}>
              {stepConfig.pip.map((active, index) => (
                <StepPip key={index} active={active} />
              ))}
            </div>
          </div>

          <div style={loginStyles.panelBody}>
            {isLogin ? (
              <form onSubmit={onSubmitLogin}>
                <span style={loginStyles.fieldLabel}>Email address</span>
                <TextInput
                  type="email"
                  value={loginEmail}
                  onChange={onLoginEmailChange}
                  placeholder="you@example.com"
                  autoFocus
                />
                <span style={{ ...loginStyles.fieldLabel, marginTop: "14px" }}>Password</span>
                <TextInput
                  type="password"
                  value={loginPassword}
                  onChange={onLoginPasswordChange}
                  placeholder="Enter password"
                />
                <PrimaryBtn type="submit" disabled={authLoading}>
                  {authLoading ? "Signing in..." : "Sign in"}
                </PrimaryBtn>
              </form>
            ) : (
              <form onSubmit={onSubmitRegister}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <span style={loginStyles.fieldLabel}>First name</span>
                    <TextInput
                      type="text"
                      value={registerFirstName}
                      onChange={onRegisterFirstNameChange}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <span style={loginStyles.fieldLabel}>Last name</span>
                    <TextInput
                      type="text"
                      value={registerLastName}
                      onChange={onRegisterLastNameChange}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <span style={{ ...loginStyles.fieldLabel, marginTop: "10px" }}>Phone number</span>
                <TextInput
                  type="tel"
                  value={registerPhone}
                  onChange={onRegisterPhoneChange}
                  placeholder="10-digit mobile number"
                />
                <span style={{ ...loginStyles.fieldLabel, marginTop: "10px" }}>Email address</span>
                <TextInput
                  type="email"
                  value={registerEmail}
                  onChange={onRegisterEmailChange}
                  placeholder="you@example.com"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <span style={loginStyles.fieldLabel}>Class</span>
                    <TextInput
                      type="number"
                      value={registerClass}
                      onChange={onRegisterClassChange}
                      placeholder="11"
                    />
                  </div>
                  <div>
                    <span style={loginStyles.fieldLabel}>Stream</span>
                    <TextInput
                      type="text"
                      value={registerStream}
                      onChange={onRegisterStreamChange}
                      placeholder="JEE"
                    />
                  </div>
                </div>
                <span style={{ ...loginStyles.fieldLabel, marginTop: "10px" }}>Password</span>
                <TextInput
                  type="password"
                  value={registerPassword}
                  onChange={onRegisterPasswordChange}
                  placeholder="Create password"
                />
                <PrimaryBtn type="submit" disabled={authLoading}>
                  {authLoading ? "Creating account..." : "Sign up"}
                </PrimaryBtn>
              </form>
            )}
            {socketError ? <p className="error">{socketError}</p> : null}
            <div style={loginStyles.divider} />
            <div style={loginStyles.metaRow}>
              <span>{isLogin ? "New here?" : "Already have an account?"}</span>
              <button
                type="button"
                onClick={() => onSwitchMode(isLogin ? "register" : "login")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#2563eb",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <aside className="auth-right">
        <div className="auth-right-content">
          <h2>AI Mentor</h2>
          <p>Your personalized guide for interview and entrance preparation.</p>
        </div>
      </aside>
    </main>
  );
}
