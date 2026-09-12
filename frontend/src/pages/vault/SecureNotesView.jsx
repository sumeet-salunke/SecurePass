import { useState, useMemo } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import SecureNoteModal from "./SecureNoteModal.jsx";
import SecureNoteDetailModal from "./SecureNoteDetailModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

const ITEMS_PER_PAGE = 9;

export default function SecureNotesView() {
  const {
    secureNotes,
    addNote,
    editNote,
    toggleFavoriteNote,
    removeNote,
    itemsLoading,
    itemsError,
    refreshVaultData,
  } = useVault();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [revealedNotes, setRevealedNotes] = useState({});
  const [saving, setSaving] = useState(false);

  // Client-side filtering across decrypted in-memory records
  const filteredNotes = useMemo(() => {
    return secureNotes.filter((item) => {
      if (onlyFavorites && !item.favorite) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q);
        return matchTitle || matchContent;
      }
      return true;
    });
  }, [secureNotes, onlyFavorites, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / ITEMS_PER_PAGE));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotes, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterToggle = (fav) => {
    setOnlyFavorites(fav);
    setCurrentPage(1);
  };

  const handleCopy = (text) => {
    if (!text) {
      toast.info("Note has no content to copy.");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success("Note content copied to clipboard!");
  };

  const toggleReveal = (e, id) => {
    e.stopPropagation();
    setRevealedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingItem) {
        await editNote(editingItem.id, formData);
        toast.success("Secure note updated!");
        if (detailItem && detailItem.id === editingItem.id) {
          setDetailItem({ ...detailItem, ...formData });
        }
      } else {
        await addNote(formData);
        toast.success("New secure note encrypted & saved!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save secure note.");
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
      if (detailItem && detailItem.id === deleteConfirmId) {
        setDetailItem(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete secure note.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (e, id, currentFav) => {
    if (e) e.stopPropagation();
    try {
      await toggleFavoriteNote(id, currentFav);
      if (detailItem && detailItem.id === id) {
        setDetailItem((prev) => (prev ? { ...prev, favorite: !currentFav } : null));
      }
    } catch (err) {
      toast.error(err.message || "Failed to update favorite status.");
    }
  };

  const handleCardKeyDown = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDetailItem(item);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 className="section-title">Secure Notes</h1>
            <span
              className="nav-badge"
              style={{
                color: "var(--accent-emerald)",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              {secureNotes.length} total
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            AES-256-GCM zero-knowledge encrypted notes, recovery seeds, and confidential documents
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => refreshVaultData()}
            disabled={itemsLoading}
            title="Refresh notes from server"
            aria-label="Refresh notes"
          >
            {itemsLoading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
          <button
            className="btn btn-emerald btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            aria-label="Add new secure note"
          >
            + Add Secure Note
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {itemsError && (
        <div
          className="toast-card toast-error animate-fade-in"
          style={{ marginBottom: "1.25rem", width: "100%", maxWidth: "100%" }}
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

      {/* Search & Filter Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginTop: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "440px", width: "100%" }}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search titles and note content in memory..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
            aria-label="Search secure notes"
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn-filter ${!onlyFavorites ? "active" : ""}`}
            onClick={() => handleFilterToggle(false)}
            aria-label={`Show all notes (${secureNotes.length})`}
          >
            All Notes ({secureNotes.length})
          </button>
          <button
            className={`btn-filter ${onlyFavorites ? "active" : ""}`}
            onClick={() => handleFilterToggle(true)}
            aria-label={`Show favorite notes (${secureNotes.filter((n) => n.favorite).length})`}
          >
            ⭐ Favorites ({secureNotes.filter((n) => n.favorite).length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {itemsLoading && secureNotes.length === 0 ? (
        <div
          style={{
            minHeight: "35vh",
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
            Decrypting secure notes in memory...
          </p>
        </div>
      ) : secureNotes.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">No secure notes in vault yet</h3>
          <p className="empty-desc">
            Store recovery keys, private memo seeds, and confidential documents with client-side zero-knowledge encryption.
          </p>
          <button
            className="btn btn-emerald btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            + Create First Secure Note
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No matching secure notes</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No notes match query "${searchQuery}"`
              : "You have not marked any secure notes as favorites yet."}
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setOnlyFavorites(false);
              setCurrentPage(1);
            }}
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {paginatedNotes.map((item) => (
              <div
                key={item.id}
                className="item-card"
                onClick={() => setDetailItem(item)}
                onKeyDown={(e) => handleCardKeyDown(e, item)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`View secure note: ${item.title}`}
              >
                <div>
                  <div className="item-card-header">
                    <div className="item-avatar-title">
                      <div className="item-avatar" style={{ color: "var(--accent-emerald)" }}>
                        📝
                      </div>
                      <div>
                        <div className="item-title">{item.title || "Untitled Note"}</div>
                        <span className="item-category-badge" style={{ color: "var(--accent-emerald)" }}>
                          AES-256-GCM
                        </span>
                      </div>
                    </div>

                    <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`icon-btn ${item.favorite ? "active-favorite" : ""}`}
                        onClick={(e) => handleToggleFavorite(e, item.id, item.favorite)}
                        title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                        aria-label={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        {item.favorite ? "⭐" : "☆"}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => toggleReveal(e, item.id)}
                        title={revealedNotes[item.id] ? "Hide note preview" : "Reveal note preview"}
                        aria-label={revealedNotes[item.id] ? "Hide note preview" : "Reveal note preview"}
                      >
                        {revealedNotes[item.id] ? "👁️" : "👁️‍🗨️"}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.content);
                        }}
                        title="Copy note text"
                        aria-label="Copy note text"
                        disabled={!item.content}
                      >
                        📋
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setModalOpen(true);
                        }}
                        title="Edit Note"
                        aria-label="Edit Note"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        title="Delete Note"
                        aria-label="Delete Note"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Note Content / Protected Preview */}
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 0.875rem",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      maxHeight: "130px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.8125rem",
                      color: revealedNotes[item.id] ? "var(--text-primary)" : "var(--text-muted)",
                      fontFamily: "JetBrains Mono, monospace",
                      lineHeight: 1.5,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {revealedNotes[item.id] ? (
                      item.content || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>(Empty note content)</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🔒</span>
                        <span style={{ fontSize: "0.75rem" }}>Content hidden. Click card or eye icon to view.</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Timestamp */}
                  <div
                    style={{
                      marginTop: "0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{item.content ? `${item.content.length} chars` : "0 chars"}</span>
                    <span>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "2rem",
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Page {currentPage} of {totalPages} ({filteredNotes.length} notes)
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit / Create Modal */}
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

      {/* Detail Modal */}
      <SecureNoteDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={(item) => {
          setEditingItem(item);
          setModalOpen(true);
        }}
        onDelete={(id) => setDeleteConfirmId(id)}
        onToggleFavorite={(id, currentFav) => handleToggleFavorite(null, id, currentFav)}
        onCopy={handleCopy}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Secure Note"
        message="Are you sure you want to permanently delete this secure note? This action cannot be undone."
        confirmText="Delete Note"
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}
