import { useState, useMemo } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import CredentialModal from "./CredentialModal.jsx";
import CredentialDetailModal from "./CredentialDetailModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

const CATEGORIES = ["All", "Favorites", "Login", "Banking", "Email", "Social", "Work", "Shopping", "Other"];
const ITEMS_PER_PAGE = 9;

export default function CredentialsView() {
  const {
    credentials,
    addCredential,
    editCredential,
    toggleFavoriteCredential,
    removeCredential,
    itemsLoading,
    itemsError,
    refreshVaultData,
  } = useVault();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [saving, setSaving] = useState(false);

  // Client-side filtering across decrypted in-memory fields
  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      if (selectedCategory === "Favorites" && !item.favorite) return false;
      if (selectedCategory !== "All" && selectedCategory !== "Favorites" && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchUser = item.username?.toLowerCase().includes(q);
        const matchUrl = item.url?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        return matchTitle || matchUser || matchUrl || matchNotes;
      }
      return true;
    });
  }, [credentials, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCredentials.length / ITEMS_PER_PAGE));
  const paginatedCredentials = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCredentials.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCredentials, currentPage]);

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

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const togglePasswordReveal = (e, id) => {
    e.stopPropagation();
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingItem) {
        await editCredential(editingItem.id, formData);
        toast.success("Credential updated successfully!");
        if (detailItem && detailItem.id === editingItem.id) {
          setDetailItem({ ...detailItem, ...formData });
        }
      } else {
        await addCredential(formData);
        toast.success("New credential encrypted & saved to vault!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save credential.");
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
      if (detailItem && detailItem.id === deleteConfirmId) {
        setDetailItem(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete credential.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (e, id, currentFav) => {
    if (e) e.stopPropagation();
    try {
      await toggleFavoriteCredential(id, currentFav);
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
            <h1 className="section-title">Logins & Credentials</h1>
            <span className="nav-badge" style={{ color: "var(--accent-sky)", background: "rgba(56, 189, 248, 0.12)" }}>
              {credentials.length} total
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Client-side zero-knowledge encrypted accounts, passwords, and sensitive keys
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => refreshVaultData()}
            disabled={itemsLoading}
            title="Refresh credentials"
            aria-label="Refresh credentials"
          >
            {itemsLoading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            aria-label="Add new credential"
          >
            + Add Credential
          </button>
        </div>
      </div>

      {/* Error alert if sync failed */}
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

      {/* Search & Category Filter Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          marginTop: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "480px", width: "100%" }}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search titles, usernames, URLs, notes in memory..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
            aria-label="Search credentials"
          />
        </div>

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn-filter ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat === "Favorites" ? "⭐ Favorites" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {itemsLoading && credentials.length === 0 ? (
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
            Decrypting credentials in memory...
          </p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🔑</div>
          <h3 className="empty-title">No credentials in vault yet</h3>
          <p className="empty-desc">
            Store your website logins, API credentials, and private account passwords safely with zero-knowledge encryption.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            + Create Your First Credential
          </button>
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No matching credentials found</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No credentials match query "${searchQuery}"`
              : selectedCategory === "Favorites"
              ? "You have not marked any credentials as favorites yet."
              : `No credentials found under category "${selectedCategory}".`}
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setCurrentPage(1);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {paginatedCredentials.map((item) => (
              <div
                key={item.id}
                className="item-card"
                onClick={() => setDetailItem(item)}
                onKeyDown={(e) => handleCardKeyDown(e, item)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${item.title}`}
              >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setModalOpen(true);
                        }}
                        title="Edit Credential"
                        aria-label="Edit Credential"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        title="Delete Credential"
                        aria-label="Delete Credential"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.875rem" }}>
                    {item.username && (
                      <div className="item-field-row" onClick={(e) => e.stopPropagation()}>
                        <span className="item-field-label">User</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="item-field-value">{item.username}</span>
                          <button
                            className="icon-btn"
                            onClick={() => handleCopy(item.username, "Username")}
                            title="Copy username"
                            aria-label="Copy username"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}

                    {item.password && (
                      <div className="item-field-row" onClick={(e) => e.stopPropagation()}>
                        <span className="item-field-label">Password</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="item-field-value mono">
                            {revealedPasswords[item.id] ? item.password : "••••••••••••"}
                          </span>
                          <button
                            className="icon-btn"
                            onClick={(e) => togglePasswordReveal(e, item.id)}
                            title={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                            aria-label={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[item.id] ? "👁️" : "👁️‍🗨️"}
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => handleCopy(item.password, "Password")}
                            title="Copy password"
                            aria-label="Copy password"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}

                    {item.url && (
                      <div className="item-field-row" onClick={(e) => e.stopPropagation()}>
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
                      marginTop: "0.75rem",
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
                Page {currentPage} of {totalPages} ({filteredCredentials.length} credentials)
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

      {/* Full Detail Modal */}
      <CredentialDetailModal
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
        title="Delete Credential"
        message="Are you sure you want to permanently delete this credential from your vault? This cannot be undone."
        confirmText="Delete Credential"
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}
