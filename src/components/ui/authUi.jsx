const ACCENT = "#2563eb";
const NAVY = "#102a43";

export const loginStyles = {
  scene: {
    minHeight: "100vh",
    background: "#f3f7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1rem",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "420px",
    overflow: "hidden",
    border: "1px solid #e8e6e0",
  },
  panelTop: {
    background: NAVY,
    padding: "2rem 2rem 2.5rem",
  },
  brandMark: {
    width: "42px",
    height: "42px",
    background: ACCENT,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  topTitle: {
    fontSize: "22px",
    fontWeight: 500,
    color: "#ffffff",
    marginBottom: "6px",
    lineHeight: 1.3,
  },
  topSub: {
    fontSize: "13px",
    color: "#b7c3d6",
    lineHeight: 1.6,
    margin: 0,
  },
  stepsRow: {
    display: "flex",
    gap: "6px",
    marginTop: "1.5rem",
  },
  panelBody: {
    padding: "2rem",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#888",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "8px",
    display: "block",
  },
  divider: {
    height: "1px",
    background: "#f0ede8",
    margin: "1.5rem 0",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#888",
  },
};

export function StepPip({ active }) {
  return (
    <div
      style={{
        height: "3px",
        borderRadius: "2px",
        flex: 1,
        background: active ? ACCENT : "rgba(255,255,255,0.15)",
        transition: "background 0.3s",
      }}
    />
  );
}

export function PrimaryBtn({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px",
        fontSize: "15px",
        fontWeight: 500,
        borderRadius: "12px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#b8c5db" : NAVY,
        color: "#fff",
        marginTop: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {children}
    </button>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", error, autoFocus }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: "100%",
        padding: "13px 16px",
        fontSize: "15px",
        borderRadius: "12px",
        border: `1.5px solid ${error ? "#e24b4a" : "#e8e6e0"}`,
        background: "#fafaf8",
        color: NAVY,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}
