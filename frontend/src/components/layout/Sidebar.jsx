import { useAuth } from "../../context/AuthContext.jsx";
import { useVault } from "../../context/VaultContext.jsx";

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onCloseMobile }) {
  const { user, logoutUser } = useAuth();
  const { hasVault, isUnlocked, lockVault } = useVault();

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLockVault = () => {
    lockVault();
    if (activeTab.startsWith("vault")) {
      setActiveTab("vault");
    }
  };

  const isVaultTab = activeTab.startsWith("vault");

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🛡️</div>
          <span className="sidebar-brand-text">SecurePass</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="nav-section-title">Overview</div>

        <button
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavClick("dashboard")}
          aria-current={activeTab === "dashboard" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">📊</span>
            <span>Dashboard</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "account" ? "active" : ""}`}
          onClick={() => handleNavClick("account")}
          aria-current={activeTab === "account" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">👤</span>
            <span>Account & Profile</span>
          </div>
        </button>

        <div className="nav-section-title">Security Settings</div>

        <button
          className={`nav-item ${activeTab === "password" ? "active" : ""}`}
          onClick={() => handleNavClick("password")}
          aria-current={activeTab === "password" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🔑</span>
            <span>Change Password</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "email" ? "active" : ""}`}
          onClick={() => handleNavClick("email")}
          aria-current={activeTab === "email" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">✉️</span>
            <span>Change Email</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "security" ? "active" : ""}`}
          onClick={() => handleNavClick("security")}
          aria-current={activeTab === "security" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🛡️</span>
            <span>Two-Factor Auth</span>
          </div>
          {user?.mfaEnabled && <span className="nav-badge" style={{ color: "var(--accent-emerald)" }}>ON</span>}
        </button>

        <button
          className={`nav-item ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => handleNavClick("sessions")}
          aria-current={activeTab === "sessions" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">📱</span>
            <span>Active Sessions</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "danger" ? "active" : ""}`}
          onClick={() => handleNavClick("danger")}
          style={{ color: "var(--accent-rose)" }}
          aria-current={activeTab === "danger" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">⚠️</span>
            <span>Delete Account</span>
          </div>
        </button>

        <div className="nav-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Encrypted Vault</span>
          {isUnlocked ? (
            <span className="nav-badge" style={{ color: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.15)" }}>
              UNLOCKED
            </span>
          ) : hasVault === false ? (
            <span className="nav-badge" style={{ color: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.15)" }}>
              SETUP
            </span>
          ) : (
            <span className="nav-badge" style={{ color: "var(--text-muted)" }}>
              LOCKED
            </span>
          )}
        </div>

        <button
          className={`nav-item ${activeTab === "vault" || activeTab === "vault-dashboard" ? "active" : ""}`}
          onClick={() => handleNavClick("vault")}
          aria-current={activeTab === "vault" || activeTab === "vault-dashboard" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🔒</span>
            <span>Vault Overview</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "vault-credentials" ? "active" : ""}`}
          onClick={() => handleNavClick("vault-credentials")}
          aria-current={activeTab === "vault-credentials" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🔑</span>
            <span>Credentials</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "vault-notes" ? "active" : ""}`}
          onClick={() => handleNavClick("vault-notes")}
          aria-current={activeTab === "vault-notes" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">📝</span>
            <span>Secure Notes</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "vault-totp" ? "active" : ""}`}
          onClick={() => handleNavClick("vault-totp")}
          aria-current={activeTab === "vault-totp" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">⏱️</span>
            <span>2FA Authenticator</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "vault-generator" ? "active" : ""}`}
          onClick={() => handleNavClick("vault-generator")}
          aria-current={activeTab === "vault-generator" ? "page" : undefined}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">⚡</span>
            <span>Password Generator</span>
          </div>
        </button>

        {isUnlocked && (
          <button
            className="nav-item"
            onClick={handleLockVault}
            style={{ color: "var(--accent-amber)", marginTop: "0.5rem" }}
            title="Lock your zero-knowledge vault immediately"
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">🔒</span>
              <span>Lock Vault</span>
            </div>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          className="user-profile-badge"
          onClick={() => handleNavClick("account")}
          title="View Account Profile"
          style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || "SecurePass User"}</div>
            <div className="user-email">{user?.email || ""}</div>
          </div>
        </button>

        <button
          className="btn btn-secondary btn-sm btn-block"
          onClick={logoutUser}
          style={{ marginTop: "0.25rem" }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
