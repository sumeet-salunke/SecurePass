import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";
import { generatePassword, calculatePasswordStrength } from "../../utils/crypto.js";

export default function CredentialModal({ isOpen, onClose, onSave, initialData = null, loading = false }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setCategory(initialData.category || "Login");
      setUsername(initialData.username || "");
      setPassword(initialData.password || "");
      setUrl(initialData.url || "");
      setNotes(initialData.notes || "");
      setFavorite(Boolean(initialData.favorite));
    } else {
      setTitle("");
      setCategory("Login");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
      setFavorite(false);
    }
    setShowPassword(false);
  }, [initialData, isOpen]);

  const categories = ["Login", "Banking", "Email", "Social", "Work", "Shopping", "Other"];
  const strength = calculatePasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generatePassword({ length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true });
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      category,
      username: username.trim(),
      password,
      url: url.trim(),
      notes: notes.trim(),
      favorite,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Credential" : "Add New Credential"}
      maxWidth="560px"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? "Encrypting & Saving..." : initialData ? "Save Changes" : "Create Credential"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. GitHub, Netflix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Username / Email</label>
          <input
            type="text"
            className="form-input"
            placeholder="user@example.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <label>Password</label>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: "0.75rem", padding: 0, color: "var(--accent-cyan)" }}
              onClick={handleGeneratePassword}
            >
              ⚡ Generate Strong
            </button>
          </div>
          <div className="form-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input mono"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="form-input-addon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {password && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Strength</span>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${strength.score}%`,
                    background: strength.color,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Website URL</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://example.com/login"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Additional details, security questions, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input
            id="cred-favorite"
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
          />
          <label htmlFor="cred-favorite" style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer" }}>
            Add to Favorites ⭐
          </label>
        </div>
      </form>
    </Modal>
  );
}
