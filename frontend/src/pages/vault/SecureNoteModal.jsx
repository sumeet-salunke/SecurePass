import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";

export default function SecureNoteModal({ isOpen, onClose, onSave, initialData = null, loading = false }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setFavorite(Boolean(initialData.favorite));
    } else {
      setTitle("");
      setContent("");
      setFavorite(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      favorite,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Secure Note" : "New Secure Note"}
      maxWidth="600px"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-emerald btn-sm" onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? "Encrypting & Saving..." : initialData ? "Save Changes" : "Create Note"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Note Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. WiFi Passwords, Crypto Seed Backup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Encrypted Content</label>
          <textarea
            className="form-input mono"
            rows={8}
            placeholder="Type your sensitive confidential notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input
            id="note-favorite"
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            style={{ accentColor: "var(--accent-emerald)", width: "16px", height: "16px" }}
          />
          <label htmlFor="note-favorite" style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer" }}>
            Add to Favorites ⭐
          </label>
        </div>
      </form>
    </Modal>
  );
}
