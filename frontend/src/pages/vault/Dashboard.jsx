import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function Dashboard({
  onNavigateTab,
  onOpenNewCredential,
  onOpenNewNote,
  onOpenNewTOTP,
  onOpenGenerator,
}) {
  const { vaultStats, credentials, secureNotes, totpList } = useVault();
  const toast = useToast();

  const totalCreds = credentials.length;
  const favCreds = credentials.filter((c) => c.favorite).length;
  const totalNotes = secureNotes.length;
  const totalTotp = totpList.length;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const recentItems = [...credentials, ...secureNotes].slice(0, 6);

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Vault Overview</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Zero-knowledge encrypted client storage with AES-256-GCM
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={onOpenNewCredential}>
            + Add Login
          </button>
          <button className="btn btn-emerald btn-sm" onClick={onOpenNewNote}>
            + Add Note
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenNewTOTP}>
            + Add 2FA
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigateTab("credentials")} style={{ cursor: "pointer" }}>
          <div className="stat-icon-wrapper stat-icon-cyan">🔑</div>
          <div>
            <div className="stat-number">{totalCreds}</div>
            <div className="stat-label">Logins ({favCreds} starred)</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab("notes")} style={{ cursor: "pointer" }}>
          <div className="stat-icon-wrapper stat-icon-emerald">📝</div>
          <div>
            <div className="stat-number">{totalNotes}</div>
            <div className="stat-label">Secure Notes</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab("totp")} style={{ cursor: "pointer" }}>
          <div className="stat-icon-wrapper stat-icon-purple">⏱️</div>
          <div>
            <div className="stat-number">{totalTotp}</div>
            <div className="stat-label">2FA Authenticators</div>
          </div>
        </div>

        <div className="stat-card" onClick={onOpenGenerator} style={{ cursor: "pointer" }}>
          <div className="stat-icon-wrapper stat-icon-amber">⚡</div>
          <div>
            <div className="stat-number">AES-256</div>
            <div className="stat-label">Zero-Knowledge Guard</div>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recent Vault Items</h2>
        <button
          className="btn-ghost"
          style={{ fontSize: "0.8125rem", color: "var(--accent-cyan)", padding: 0 }}
          onClick={() => onNavigateTab("credentials")}
        >
          View all items →
        </button>
      </div>

      {recentItems.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🛡️</div>
          <h3 className="empty-title">Your vault is empty</h3>
          <p className="empty-desc">Start adding login credentials, secure notes, or 2FA authenticators.</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-primary btn-sm" onClick={onOpenNewCredential}>
              Add First Login
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onOpenNewNote}>
              Create Note
            </button>
          </div>
        </div>
      ) : (
        <div className="items-grid">
          {recentItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-card-header">
                <div className="item-avatar-title">
                  <div className="item-avatar">
                    {"content" in item ? "📝" : item.category === "Banking" ? "💳" : "🔑"}
                  </div>
                  <div>
                    <div className="item-title">{item.title || "Untitled Item"}</div>
                    <span className="item-category-badge">
                      {"content" in item ? "Secure Note" : item.category || "Login"}
                    </span>
                  </div>
                </div>
              </div>

              {"username" in item && item.username && (
                <div className="item-field-row">
                  <span className="item-field-label">Username</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="item-field-value">{item.username}</span>
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(item.username, "Username")}
                      title="Copy username"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {"password" in item && item.password && (
                <div className="item-field-row">
                  <span className="item-field-label">Password</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="item-field-value mono">••••••••••••</span>
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(item.password, "Password")}
                      title="Copy password"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {"content" in item && (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.8125rem",
                    maxHeight: "3.2em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.content || "(Empty note)"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
