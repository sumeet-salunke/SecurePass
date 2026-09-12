import { useState } from "react";
import Modal from "../../components/common/Modal.jsx";

export default function CredentialDetailModal({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title || "Credential Details"}
      maxWidth="520px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              onClose();
              onDelete(item.id);
            }}
          >
            🗑️ Delete
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              ✏️ Edit
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header summary */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-md)",
                background: "rgba(37, 99, 235, 0.15)",
                border: "1px solid rgba(37, 99, 235, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              {item.category === "Banking" ? "💳" : item.category === "Email" ? "✉️" : "🔑"}
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {item.title}
              </h3>
              <span className="item-category-badge">{item.category || "Login"}</span>
            </div>
          </div>

          <button
            className={`icon-btn ${item.favorite ? "active-favorite" : ""}`}
            onClick={() => onToggleFavorite(item.id, item.favorite)}
            title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-label={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            {item.favorite ? "⭐" : "☆"}
          </button>
        </div>

        {/* Username Row */}
        {item.username && (
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Username / Email
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9375rem", color: "var(--text-primary)", wordBreak: "break-all" }}>
                {item.username}
              </span>
              <button
                className="icon-btn"
                onClick={() => onCopy(item.username, "Username")}
                title="Copy username"
                aria-label="Copy username"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Password Row */}
        {item.password && (
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Password
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span
                className="mono"
                style={{
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                  letterSpacing: showPassword ? "normal" : "0.15em",
                }}
              >
                {showPassword ? item.password : "••••••••••••••••"}
              </span>
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button
                  className="icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Reveal password"}
                  aria-label={showPassword ? "Hide password" : "Reveal password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                <button
                  className="icon-btn"
                  onClick={() => onCopy(item.password, "Password")}
                  title="Copy password"
                  aria-label="Copy password"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Website URL */}
        {item.url && (
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Website URL
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <a
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-cyan)", textDecoration: "none", fontSize: "0.9375rem", wordBreak: "break-all" }}
              >
                {item.url} ↗
              </a>
              <button
                className="icon-btn"
                onClick={() => onCopy(item.url, "URL")}
                title="Copy website URL"
                aria-label="Copy website URL"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Notes
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {item.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        {item.updatedAt && (
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "right" }}>
            Last modified: {new Date(item.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </Modal>
  );
}
