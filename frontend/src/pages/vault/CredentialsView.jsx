import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import CredentialModal from "./CredentialModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

export default function CredentialsView({ searchQuery = "", selectedCategory = "All", onlyFavorites = false }) {
  const { credentials, addCredential, editCredential, toggleFavoriteCredential, removeCredential } = useVault();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [saving, setSaving] = useState(false);

  const filteredCredentials = credentials.filter((item) => {
    if (onlyFavorites && !item.favorite) return false;
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchUrl;
    }
    return true;
  });

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingItem) {
        await editCredential(editingItem.id, formData);
        toast.success("Credential updated successfully!");
      } else {
        await addCredential(formData);
        toast.success("New credential saved to vault!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.message || "Failed to save credential.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setSaving(true);
      await removeCredential(deleteConfirmId);
      toast.info("Credential removed from vault.");
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete credential.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {onlyFavorites ? "Favorite Logins" : selectedCategory !== "All" ? `${selectedCategory} Logins` : "Logins & Credentials"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {filteredCredentials.length} item{filteredCredentials.length === 1 ? "" : "s"} found
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          + Add Credential
        </button>
      </div>

      {filteredCredentials.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🔑</div>
          <h3 className="empty-title">No credentials found</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No items match "${searchQuery}"`
              : onlyFavorites
              ? "You haven't starred any credentials yet."
              : "Store website logins, API keys, and account passwords safely."}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            Create New Credential
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {filteredCredentials.map((item) => (
            <div key={item.id} className="item-card">
              <div>
                <div className="item-card-header">
                  <div className="item-avatar-title">
                    <div className="item-avatar">
                      {item.category === "Banking" ? "💳" : item.category === "Email" ? "✉️" : "🔑"}
                    </div>
                    <div>
                      <div className="item-title">{item.title || "Untitled Credential"}</div>
                      <span className="item-category-badge">{item.category || "Login"}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button
                      className={`icon-btn ${item.favorite ? "active-favorite" : ""}`}
                      onClick={() => toggleFavoriteCredential(item.id, item.favorite)}
                      title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      {item.favorite ? "⭐" : "☆"}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setEditingItem(item);
                        setModalOpen(true);
                      }}
                      title="Edit Credential"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setDeleteConfirmId(item.id)}
                      title="Delete Credential"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                  {item.username && (
                    <div className="item-field-row">
                      <span className="item-field-label">Username</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="item-field-value">{item.username}</span>
                        <button
                          className="icon-btn"
                          onClick={() => handleCopy(item.username, "Username")}
                          title="Copy username"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {item.password && (
                    <div className="item-field-row">
                      <span className="item-field-label">Password</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="item-field-value mono">
                          {revealedPasswords[item.id] ? item.password : "••••••••••••"}
                        </span>
                        <button
                          className="icon-btn"
                          onClick={() => togglePasswordReveal(item.id)}
                          title={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                        >
                          {revealedPasswords[item.id] ? "👁️" : "👁️‍🗨️"}
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleCopy(item.password, "Password")}
                          title="Copy password"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {item.url && (
                    <div className="item-field-row">
                      <span className="item-field-label">Website</span>
                      <a
                        href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="item-field-value"
                        style={{ color: "var(--accent-cyan)", textDecoration: "none" }}
                      >
                        {item.url.replace(/^https?:\/\//, "")} ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {item.notes && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "0.5rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  📝 {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <CredentialModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        initialData={editingItem}
        loading={saving}
      />

      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Credential"
        message="Are you sure you want to permanently delete this credential from your vault? This cannot be undone."
        confirmText="Delete Credential"
        loading={saving}
      />
    </div>
  );
}
