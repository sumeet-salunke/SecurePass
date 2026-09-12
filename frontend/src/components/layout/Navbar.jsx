import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar({ onToggleMobileNav }) {
  const { user, logoutUser } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="icon-btn mobile-toggle"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation"
          style={{ display: "none" }}
        >
          ☰
        </button>

        <span className="status-pill status-pill-blue">
          <span>●</span>
          <span>{user?.mfaEnabled ? "2FA Protected" : "Authenticated Session"}</span>
        </span>
      </div>

      <div className="navbar-right">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {user?.email || ""}
          </span>
        </div>

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
