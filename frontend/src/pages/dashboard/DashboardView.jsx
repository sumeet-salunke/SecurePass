import { useAuth } from "../../context/AuthContext.jsx";
import { useVault } from "../../context/VaultContext.jsx";

export default function DashboardView({ onNavigateTab }) {
  const { user } = useAuth();
  const { hasVault, isUnlocked } = useVault();

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
            onClick={() => onNavigateTab("account")}
          >
            👤 Account Profile
          </button>
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

          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="status-pill status-pill-emerald">
              ✓ Verified Account
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab("account")}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
            >
              View Profile →
            </button>
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

      {/* Vault Status & Access Banner */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", maxWidth: "680px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(37, 99, 235, 0.15)",
                border: "1px solid rgba(37, 99, 235, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.375rem",
                flexShrink: 0,
              }}
            >
              🔒
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Zero-Knowledge Encrypted Vault
                </h2>
                {isUnlocked ? (
                  <span className="nav-badge" style={{ color: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.15)" }}>
                    UNLOCKED 🔓
                  </span>
                ) : hasVault === false ? (
                  <span className="nav-badge" style={{ color: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.15)" }}>
                    SETUP REQUIRED
                  </span>
                ) : (
                  <span className="nav-badge" style={{ color: "var(--text-muted)" }}>
                    LOCKED 🔒
                  </span>
                )}
              </div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  marginTop: "0.35rem",
                  lineHeight: 1.5,
                }}
              >
                Client-side AES-256-GCM encrypted storage for logins, credentials, private secure notes, and RFC 6238 TOTP authenticators. Keys never leave your browser.
              </p>
            </div>
          </div>

          <button
            className={`btn ${isUnlocked ? "btn-primary" : hasVault === false ? "btn-emerald" : "btn-primary"}`}
            onClick={() => onNavigateTab("vault")}
          >
            {isUnlocked ? "Open Vault →" : hasVault === false ? "Setup Master Key →" : "Unlock Vault 🔑"}
          </button>
        </div>
      </div>
    </div>
  );
}

