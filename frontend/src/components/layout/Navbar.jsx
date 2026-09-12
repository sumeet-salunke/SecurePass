import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar({ onToggleMobileNav, onNavigateTab }) {
  const { user, logoutUser } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="icon-btn mobile-toggle"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <span className="status-pill status-pill-blue">
          <span>●</span>
          <span>{user?.mfaEnabled ? "2FA Protected" : "Authenticated Session"}</span>
        </span>
      </div>

      <div className="navbar-right">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onNavigateTab && onNavigateTab("account")}
          title="View Account Profile"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.6rem" }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {user?.email || ""}
          </span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={logoutUser}
          title="Sign out of account"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
