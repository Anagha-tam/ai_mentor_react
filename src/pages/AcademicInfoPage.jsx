import { useState } from "react";
import { PrimaryBtn, TextInput, loginStyles } from "../ui/authUi.jsx";

export function AcademicInfoPage({ profile, loading, error, onChange, onSubmit, onLogout }) {
  const [localError, setLocalError] = useState("");

  const handleSave = (event) => {
    event.preventDefault();
    const cls = Number(profile.class);
    if (!profile.stream) {
      setLocalError("Please select your stream.");
      return;
    }
    if (!Number.isFinite(cls) || cls < 1 || cls > 12) {
      setLocalError("Class must be between 1 and 12.");
      return;
    }
    setLocalError("");
    onSubmit(event);
  };

  return (
    <main style={loginStyles.scene}>
      <section style={{ ...loginStyles.panel, maxWidth: "760px" }}>
        <div style={loginStyles.panelTop}>
          <div style={loginStyles.brandMark}>AI</div>
          <p style={loginStyles.topTitle}>Academic Profile</p>
          <p style={loginStyles.topSub}>Enter your marks so AI Mentor can personalize guidance.</p>
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <form style={loginStyles.panelBody} onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <span style={loginStyles.fieldLabel}>Stream</span>
              <TextInput
                type="text"
                value={profile.stream}
                onChange={(event) => onChange("stream", event.target.value)}
                placeholder="Science (Computer Science)"
              />
            </div>
            <div>
              <span style={loginStyles.fieldLabel}>Class</span>
              <TextInput
                type="number"
                value={profile.class}
                onChange={(event) => onChange("class", event.target.value)}
                placeholder="11"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div>
              <span style={loginStyles.fieldLabel}>Physics (0-100)</span>
              <TextInput
                type="number"
                value={profile.marks.physics}
                onChange={(event) => onChange("marks.physics", event.target.value)}
                placeholder="85"
              />
            </div>
            <div>
              <span style={loginStyles.fieldLabel}>Chemistry (0-100)</span>
              <TextInput
                type="number"
                value={profile.marks.chemistry}
                onChange={(event) => onChange("marks.chemistry", event.target.value)}
                placeholder="82"
              />
            </div>
            <div>
              <span style={loginStyles.fieldLabel}>Maths (0-100)</span>
              <TextInput
                type="number"
                value={profile.marks.maths}
                onChange={(event) => onChange("marks.maths", event.target.value)}
                placeholder="88"
              />
            </div>
            <div>
              <span style={loginStyles.fieldLabel}>Biology (0-100)</span>
              <TextInput
                type="number"
                value={profile.marks.biology}
                onChange={(event) => onChange("marks.biology", event.target.value)}
                placeholder="79"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div>
              <span style={loginStyles.fieldLabel}>10th CGPA (0-10)</span>
              <TextInput
                type="number"
                value={profile.cgpa10}
                onChange={(event) => onChange("cgpa10", event.target.value)}
                placeholder="9.1"
              />
            </div>
            <div>
              <span style={loginStyles.fieldLabel}>Entrance exam</span>
              <TextInput
                type="text"
                value={profile.entranceExam}
                onChange={(event) => onChange("entranceExam", event.target.value)}
                placeholder="JEE / NEET"
              />
            </div>
          </div>

          {localError ? <p className="error">{localError}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          <PrimaryBtn type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save and continue"}
          </PrimaryBtn>
        </form>
      </section>
    </main>
  );
}
