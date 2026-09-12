import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function Dashboard({
  onNavigateTab,
  onOpenNewCredential,
  onOpenNewNote,
  onOpenNewTOTP,
  onOpenGenerator,
}) {
  const {
    vaultStats,
    credentials,
    secureNotes,
    totpList,
    itemsLoading,
    itemsError,
    refreshVaultData,
    lockVault,
  } = useVault();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const totalCreds = credentials.length;
  const favCreds = credentials.filter((c) => c.favorite).length;
  const totalNotes = secureNotes.length;
  const totalTotp = totpList.length;

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const toggleReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Combine items for client-side search and filtering
  const allItems = [
    ...credentials.map((c) => ({ ...c, itemType: "credential" })),
    ...secureNotes.map((n) => ({ ...n, itemType: "note" })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (selectedFilter === "favorites" && !item.favorite) return false;
    if (selectedFilter === "logins" && item.itemType !== "credential") return false;
    if (selectedFilter === "notes" && item.itemType !== "note") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchUrl || matchContent;
    }
    return true;
  });

  const displayItems = filteredItems.slice(0, 8);

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header & Controls Toolbar */}
      <div className="section-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 className="section-title">Vault Overview</h1>
            <span
              className="nav-badge"
              style={{
                color: "var(--accent-emerald)",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              AES-256 Unlocked 🔓
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
            Zero-knowledge encrypted client storage with AES-256-GCM in volatile browser memory
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenNewCredential}
            aria-label="Add new login credential"
          >
            + Add Login
          </button>
          <button
            className="btn btn-emerald btn-sm"
            onClick={onOpenNewNote}
            aria-label="Add new secure note"
          >
            + Add Note
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenNewTOTP}
            aria-label="Add new 2FA authenticator"
          >
            + Add 2FA
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenGenerator}
            title="Open Password Generator"
            aria-label="Open Password Generator"
          >
            ⚡ Generator
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => refreshVaultData()}
            title="Refresh decrypted items from server"
            aria-label="Refresh decrypted items"
            disabled={itemsLoading}
          >
            {itemsLoading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={lockVault}
            style={{ color: "var(--accent-amber)", borderColor: "rgba(245, 158, 11, 0.35)" }}
            title="Lock Vault session immediately"
            aria-label="Lock Vault"
          >
            🔒 Lock Vault
          </button>
        </div>
      </div>

      {/* Error / Retry Banner if item refresh failed */}
      {itemsError && (
        <div
          className="toast-card toast-error animate-fade-in"
          style={{ marginBottom: "1.5rem", width: "100%", maxWidth: "100%" }}
          role="alert"
        >
          <div className="toast-icon">✕</div>
          <div className="toast-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <p className="toast-message">{itemsError}</p>
            <button className="btn btn-secondary btn-sm" onClick={() => refreshVaultData()}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => onNavigateTab("credentials")}
          role="button"
          tabIndex={0}
          aria-label={`View Logins: ${vaultStats?.credentialCount ?? totalCreds} stored`}
        >
          <div className="stat-icon-wrapper stat-icon-cyan">🔑</div>
          <div>
            <div className="stat-number">{vaultStats?.credentialCount ?? totalCreds}</div>
            <div className="stat-label">Logins ({favCreds} starred)</div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => onNavigateTab("notes")}
          role="button"
          tabIndex={0}
          aria-label={`View Secure Notes: ${vaultStats?.noteCount ?? totalNotes} stored`}
        >
          <div className="stat-icon-wrapper stat-icon-emerald">📝</div>
          <div>
            <div className="stat-number">{vaultStats?.noteCount ?? totalNotes}</div>
            <div className="stat-label">Secure Notes</div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => onNavigateTab("totp")}
          role="button"
          tabIndex={0}
          aria-label={`View 2FA Authenticators: ${vaultStats?.totpCount ?? totalTotp} configured`}
        >
          <div className="stat-icon-wrapper stat-icon-purple">⏱️</div>
          <div>
            <div className="stat-number">{vaultStats?.totpCount ?? totalTotp}</div>
            <div className="stat-label">2FA Authenticators</div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={onOpenGenerator}
          role="button"
          tabIndex={0}
          aria-label="Zero-Knowledge Active: Click to open Password Generator"
        >
          <div className="stat-icon-wrapper stat-icon-amber">🛡️</div>
          <div>
            <div className="stat-number">AES-256</div>
            <div className="stat-label">Zero-Knowledge Guard</div>
          </div>
        </div>
      </div>

      {/* Client-Side Quick Search & Filter Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginTop: "1.75rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px", maxWidth: "440px" }}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search logins, notes, URLs in memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
            aria-label="Search decrypted vault items"
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className={`btn-filter ${selectedFilter === "all" ? "active" : ""}`}
            onClick={() => setSelectedFilter("all")}
          >
            All Items ({allItems.length})
          </button>
          <button
            className={`btn-filter ${selectedFilter === "favorites" ? "active" : ""}`}
            onClick={() => setSelectedFilter("favorites")}
          >
            ⭐ Favorites ({favCreds + secureNotes.filter((n) => n.favorite).length})
          </button>
          <button
            className={`btn-filter ${selectedFilter === "logins" ? "active" : ""}`}
            onClick={() => setSelectedFilter("logins")}
          >
            🔑 Logins ({totalCreds})
          </button>
          <button
            className={`btn-filter ${selectedFilter === "notes" ? "active" : ""}`}
            onClick={() => setSelectedFilter("notes")}
          >
            📝 Notes ({totalNotes})
          </button>
        </div>
      </div>

      {/* Items Section / State Handling */}
      {itemsLoading && allItems.length === 0 ? (
        <div
          style={{
            minHeight: "30vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
          }}
        >
          <div className="spinner" style={{ width: "28px", height: "28px", borderWidth: "3px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Decrypting vault items in memory...
          </p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", marginTop: "1rem" }}>
          <div className="empty-icon">🛡️</div>
          <h3 className="empty-title">Your vault is ready and secure</h3>
          <p className="empty-desc">
            Begin adding logins, confidential secure notes, or 2FA authenticators to your zero-knowledge storage.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-primary btn-sm" onClick={onOpenNewCredential}>
              + Add First Login
            </button>
            <button className="btn btn-emerald btn-sm" onClick={onOpenNewNote}>
              + Create Note
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onOpenNewTOTP}>
              + Add 2FA
            </button>
          </div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", marginTop: "1rem" }}>
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No matching vault items</h3>
          <p className="empty-desc">No encrypted items matched your search query "{searchQuery}".</p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(""); setSelectedFilter("all"); }}>
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {displayItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-card-header">
                <div className="item-avatar-title">
                  <div className="item-avatar">
                    {item.itemType === "note" ? "📝" : item.category === "Banking" ? "💳" : item.category === "Email" ? "✉️" : "🔑"}
                  </div>
                  <div>
                    <div className="item-title">{item.title || "Untitled Item"}</div>
                    <span className="item-category-badge">
                      {item.itemType === "note" ? "Secure Note" : item.category || "Login"}
                    </span>
                  </div>
                </div>

                {item.favorite && <span style={{ color: "#f59e0b", fontSize: "1rem" }} title="Favorite">⭐</span>}
              </div>

              {item.itemType === "credential" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.75rem" }}>
                  {item.username && (
                    <div className="item-field-row">
                      <span className="item-field-label">User</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span className="item-field-value">{item.username}</span>
                        <button
                          className="icon-btn"
                          onClick={() => copyToClipboard(item.username, "Username")}
                          title="Copy username"
                          aria-label="Copy username"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {item.password && (
                    <div className="item-field-row">
                      <span className="item-field-label">Password</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span className="item-field-value mono">
                          {revealedPasswords[item.id] ? item.password : "••••••••••••"}
                        </span>
                        <button
                          className="icon-btn"
                          onClick={() => toggleReveal(item.id)}
                          title={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                          aria-label={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                        >
                          {revealedPasswords[item.id] ? "👁️" : "👁️‍🗨️"}
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => copyToClipboard(item.password, "Password")}
                          title="Copy password"
                          aria-label="Copy password"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {item.url && (
                    <div className="item-field-row">
                      <span className="item-field-label">URL</span>
                      <span className="item-field-value" style={{ color: "var(--accent-cyan)", fontSize: "0.75rem" }}>
                        {item.url.replace(/^https?:\/\//, "")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {item.itemType === "note" && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.8125rem",
                      background: "var(--bg-input)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      color: revealedPasswords[item.id] ? "var(--text-secondary)" : "var(--text-muted)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {revealedPasswords[item.id] ? (
                      item.content || <span style={{ fontStyle: "italic" }}>(Empty note)</span>
                    ) : (
                      <span style={{ fontSize: "0.75rem" }}>🔒 Protected note content</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleReveal(item.id)}
                      style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      aria-label={revealedPasswords[item.id] ? "Hide note content" : "Reveal note content"}
                    >
                      {revealedPasswords[item.id] ? "👁️ Hide" : "👁️‍🗨️ Reveal"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyToClipboard(item.content, "Note content")}
                      style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      aria-label="Copy note content"
                      disabled={!item.content}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
