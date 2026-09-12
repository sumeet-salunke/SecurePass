import { useAuth } from "../../context/AuthContext.jsx";

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onCloseMobile }) {
  const { user, logoutUser } = useAuth();

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🛡️</div>
          <span className="sidebar-brand-text">SecurePass</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Overview</div>

        <button
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavClick("dashboard")}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">📊</span>
            <span>Dashboard</span>
          </div>
        </button>

        <div className="nav-section-title">Security & Account</div>

        <button
          className={`nav-item ${activeTab === "password" ? "active" : ""}`}
          onClick={() => handleNavClick("password")}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🔑</span>
            <span>Change Password</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "email" ? "active" : ""}`}
          onClick={() => handleNavClick("email")}
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">✉️</span>
            <span>Change Email</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === "security" ? "active" : ""}`}
          onClick={() => handleNavClick("security")}
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
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">⚠️</span>
            <span>Delete Account</span>
          </div>
        </button>

        <div className="nav-section-title">Vault</div>

        <div
          className="nav-item"
          style={{ opacity: 0.5, cursor: "default" }}
          title="Vault encryption features will be unlocked in the next sprint"
        >
          <div className="nav-item-left">
            <span className="nav-item-icon">🔒</span>
            <span>Encrypted Vault</span>
          </div>
          <span className="nav-badge">Next Phase</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || "SecurePass User"}</div>
            <div className="user-email">{user?.email || ""}</div>
          </div>
        </div>

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
