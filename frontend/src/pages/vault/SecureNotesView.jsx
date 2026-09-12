import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import SecureNoteModal from "./SecureNoteModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

export default function SecureNotesView({ searchQuery = "", onlyFavorites = false }) {
  const { secureNotes, addNote, editNote, toggleFavoriteNote, removeNote } = useVault();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredNotes = secureNotes.filter((item) => {
    if (onlyFavorites && !item.favorite) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Note content copied to clipboard!");
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingItem) {
        await editNote(editingItem.id, formData);
        toast.success("Note updated successfully!");
      } else {
        await addNote(formData);
        toast.success("New secure note saved to vault!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.message || "Failed to save secure note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setSaving(true);
      await removeNote(deleteConfirmId);
      toast.info("Secure note deleted.");
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete secure note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">{onlyFavorites ? "Favorite Secure Notes" : "Secure Notes"}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"} found
          </p>
        </div>

        <button
          className="btn btn-emerald btn-sm"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          + Add Secure Note
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">No secure notes found</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No notes match "${searchQuery}"`
              : onlyFavorites
              ? "You haven't starred any secure notes yet."
              : "Store recovery keys, secret codes, and confidential documents."}
          </p>
          <button
            className="btn btn-emerald btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            Create New Secure Note
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {filteredNotes.map((item) => (
            <div key={item.id} className="item-card">
              <div>
                <div className="item-card-header">
                  <div className="item-avatar-title">
                    <div className="item-avatar" style={{ color: "var(--accent-emerald)" }}>
                      📝
                    </div>
                    <div>
                      <div className="item-title">{item.title || "Untitled Note"}</div>
                      <span className="item-category-badge" style={{ color: "var(--accent-emerald)" }}>
                        Encrypted
                      </span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button
                      className={`icon-btn ${item.favorite ? "active-favorite" : ""}`}
                      onClick={() => toggleFavoriteNote(item.id, item.favorite)}
                      title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      {item.favorite ? "⭐" : "☆"}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleCopy(item.content)}
                      title="Copy full note"
                    >
                      📋
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setEditingItem(item);
                        setModalOpen(true);
                      }}
                      title="Edit Note"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setDeleteConfirmId(item.id)}
                      title="Delete Note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    background: "var(--bg-input)",
                    borderRadius: "var(--radius-sm)",
                    maxHeight: "160px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {item.content || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(Empty note)</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SecureNoteModal
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
        title="Delete Secure Note"
        message="Are you sure you want to permanently delete this secure note? This action cannot be undone."
        confirmText="Delete Note"
        loading={saving}
      />
    </div>
  );
}
