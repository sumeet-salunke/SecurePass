import { useAuth } from "../../context/AuthContext.jsx";

export default function DashboardView({ onNavigateTab }) {
  const { user } = useAuth();

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: "1.75rem" }}>
        <div>
          <h1 className="section-title" style={{ fontSize: "1.5rem" }}>
            Account Overview
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Manage your SecurePass identity, credentials, and access security
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab("security")}
          >
            🛡️ Security Settings
          </button>
        </div>
      </div>

      {/* Security Health & Profile Cards */}
      <div className="dashboard-grid">
        {/* Account Identity */}
        <div className="dashboard-card">
          <div>
            <div className="card-header">
              <span className="card-title">Identity Status</span>
              <span className="card-icon">👤</span>
            </div>
            <div className="card-value" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              {user?.name || "SecurePass User"}
            </div>
            <p className="card-description" style={{ marginTop: "0.25rem" }}>
              {user?.email || "User Account"}
            </p>
          </div>

          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="status-pill status-pill-emerald">
              ✓ Verified Account
            </span>
          </div>
        </div>

        {/* Two-Factor Authentication Status */}
        <div className="dashboard-card">
          <div>
            <div className="card-header">
              <span className="card-title">Two-Factor Auth</span>
              <span className="card-icon">🔐</span>
            </div>
            <div className="card-value" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              {user?.mfaEnabled ? "Enabled & Protected" : "Not Configured"}
            </div>
            <p className="card-description" style={{ marginTop: "0.25rem" }}>
              {user?.mfaEnabled
                ? "Your account requires an authenticator code on login."
                : "Add an extra layer of security to prevent unauthorized access."}
            </p>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab("security")}
            >
              {user?.mfaEnabled ? "Manage 2FA" : "Enable 2FA →"}
            </button>
          </div>
        </div>

        {/* Session Management */}
        <div className="dashboard-card">
          <div>
            <div className="card-header">
              <span className="card-title">Active Sessions</span>
              <span className="card-icon">📱</span>
            </div>
            <div className="card-value" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              Session Protected
            </div>
            <p className="card-description" style={{ marginTop: "0.25rem" }}>
              Tokens are secured with HTTP-only cookies and in-memory authorization.
            </p>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab("sessions")}
            >
              View Active Devices →
            </button>
          </div>
        </div>
      </div>

      {/* Vault Teaser / Readiness Notice */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              background: "rgba(37, 99, 235, 0.15)",
              border: "1px solid rgba(37, 99, 235, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              flexShrink: 0,
            }}
          >
            🛡️
          </div>

          <div>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Zero-Knowledge Encrypted Vault
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
                lineHeight: 1.5,
              }}
            >
              Client-side cryptographic vault storage for credentials, secure notes, and 2FA authenticator tokens will be unlocked in the upcoming security sprint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
