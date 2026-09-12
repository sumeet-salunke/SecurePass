import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";

export default function SecureNoteDetailModal({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
}) {
  // Always keep content protected/masked by default
  const [revealed, setRevealed] = useState(false);

  // Reset revealed state whenever the modal is closed or the active item changes
  useEffect(() => {
    if (!isOpen || !item) {
      setRevealed(false);
    }
  }, [isOpen, item?.id]);

  if (!item) return null;

  const charCount = item.content ? item.content.length : 0;
  const wordCount = item.content ? item.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const lineCount = item.content ? item.content.split("\n").length : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title || "Secure Note Details"}
      maxWidth="600px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              onClose();
              onDelete(item.id);
            }}
            aria-label="Delete this secure note"
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
              aria-label="Edit this secure note"
            >
              ✏️ Edit
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header Summary */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.35rem",
              }}
            >
              📝
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-word" }}>
                {item.title}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                <span className="item-category-badge" style={{ color: "var(--accent-emerald)" }}>
                  AES-256-GCM Encrypted
                </span>
                {item.favorite && (
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-amber)" }}>
                    ⭐ Starred
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <button
              className={`icon-btn ${item.favorite ? "active-favorite" : ""}`}
              onClick={() => onToggleFavorite(item.id, item.favorite)}
              title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
              aria-label={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              {item.favorite ? "⭐" : "☆"}
            </button>
            <button
              className="icon-btn"
              onClick={() => setRevealed(!revealed)}
              title={revealed ? "Hide note content" : "Reveal note content"}
              aria-label={revealed ? "Hide note content" : "Reveal note content"}
            >
              {revealed ? "👁️" : "👁️‍🗨️"}
            </button>
            <button
              className="icon-btn"
              onClick={() => onCopy(item.content)}
              title="Copy note text"
              aria-label="Copy note text"
              disabled={!item.content}
            >
              📋
            </button>
          </div>
        </div>

        {/* Note Content Box */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            minHeight: "180px",
            maxHeight: "380px",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {revealed ? (
            <div
              className="mono"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.65,
                userSelect: "text",
              }}
            >
              {item.content || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(Empty note content)</span>}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "150px",
                gap: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                🔒
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center" }}>
                Note content is protected for privacy and zero-knowledge isolation.
              </p>
              <button
                className="btn btn-emerald btn-sm"
                onClick={() => setRevealed(true)}
                aria-label="Reveal protected note content"
              >
                Reveal Content 👁️
              </button>
            </div>
          )}
        </div>

        {/* Metrics & Timestamps Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "1rem" }}>
            <span>{charCount} characters</span>
            <span>{wordCount} words</span>
            <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
          </div>
          <div>
            {item.updatedAt ? `Last modified: ${new Date(item.updatedAt).toLocaleString()}` : item.createdAt ? `Created: ${new Date(item.createdAt).toLocaleString()}` : ""}
          </div>
        </div>
      </div>
    </Modal>
  );
}
