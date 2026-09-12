import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";

export default function SecureNoteModal({ isOpen, onClose, onSave, initialData = null, loading = false }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setFavorite(Boolean(initialData.favorite));
      setError(null);
    } else {
      setTitle("");
      setContent("");
      setFavorite(false);
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Note title is required.");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Note title must be 100 characters or fewer.");
      return;
    }

    setError(null);
    onSave({
      title: trimmedTitle,
      content: content.trim(),
      favorite,
    });
  };

  const handleKeyDown = (e) => {
    // Support Cmd+Enter / Ctrl+Enter to quickly save
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Secure Note" : "New Secure Note"}
      maxWidth="620px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Tip: Press {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"} to save
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading} aria-label="Cancel">
              Cancel
            </button>
            <button
              className="btn btn-emerald btn-sm"
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              aria-label={initialData ? "Save Changes" : "Create Note"}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                  Encrypting & Saving...
                </span>
              ) : initialData ? (
                "Save Changes"
              ) : (
                "Create Note"
              )}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        {error && (
          <div
            className="toast-card toast-error animate-fade-in"
            style={{ marginBottom: "1rem", width: "100%", padding: "0.6rem 0.85rem" }}
            role="alert"
          >
            <div className="toast-icon" style={{ fontSize: "0.85rem" }}>✕</div>
            <div className="toast-content">
              <p className="toast-message" style={{ fontSize: "0.8125rem" }}>{error}</p>
            </div>
          </div>
        )}

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <label htmlFor="note-title-input" className="form-label" style={{ marginBottom: 0 }}>
              Note Title <span style={{ color: "var(--accent-danger)" }}>*</span>
            </label>
            <span style={{ fontSize: "0.75rem", color: title.length > 90 ? "var(--accent-amber)" : "var(--text-muted)" }}>
              {title.length}/100
            </span>
          </div>
          <input
            id="note-title-input"
            type="text"
            className={`form-input ${error ? "input-error" : ""}`}
            placeholder="e.g. Server SSH Keys, Crypto Wallet Seeds, WiFi Info"
            value={title}
            maxLength={100}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            required
            autoFocus
            disabled={loading}
            aria-required="true"
            aria-invalid={Boolean(error)}
          />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <label htmlFor="note-content-input" className="form-label" style={{ marginBottom: 0 }}>
              Confidential Content
            </label>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {content.length} chars
            </span>
          </div>
          <textarea
            id="note-content-input"
            className="form-input mono"
            rows={9}
            placeholder="Type or paste your sensitive confidential content here. Data is encrypted using AES-256-GCM before leaving your browser."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.85rem",
            marginTop: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="note-favorite-checkbox"
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              disabled={loading}
              style={{ accentColor: "var(--accent-emerald)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label
              htmlFor="note-favorite-checkbox"
              style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer", userSelect: "none" }}
            >
              Mark as Favorite ⭐
            </label>
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>
            🔒 AES-256-GCM Encrypted
          </span>
        </div>
      </form>
    </Modal>
  );
}
