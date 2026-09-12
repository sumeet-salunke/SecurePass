import { useState, useEffect, useMemo } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { generateTOTPCode } from "../../utils/crypto.js";
import TOTPModal from "./TOTPModal.jsx";
import TOTPDetailModal from "./TOTPDetailModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

const ITEMS_PER_PAGE = 9;

function TOTPCard({ item, onSelect, onEdit, onDelete, onCopy }) {
  const [totpData, setTotpData] = useState({ code: "------", remainingSeconds: 30, progress: 100 });

  useEffect(() => {
    let isMounted = true;
    const updateCode = async () => {
      if (!item.secretKey) return;
      const res = await generateTOTPCode(
        item.secretKey,
        item.algorithm || "SHA1",
        item.digits || 6,
        item.period || 30
      );
      if (isMounted) {
        setTotpData(res);
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [item.secretKey, item.algorithm, item.digits, item.period]);

  const formattedCode =
    totpData.code.length === 6
      ? `${totpData.code.slice(0, 3)} ${totpData.code.slice(3)}`
      : totpData.code.length === 8
      ? `${totpData.code.slice(0, 4)} ${totpData.code.slice(4)}`
      : totpData.code;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(item);
    }
  };

  return (
    <div
      className="item-card totp-card"
      onClick={() => onSelect(item)}
      onKeyDown={handleKeyDown}
      style={{ cursor: "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={`View 2FA authenticator for ${item.serviceName || "service"}`}
    >
      <div>
        <div className="item-card-header">
          <div className="item-avatar-title">
            <div className="item-avatar" style={{ color: "var(--accent-purple)" }}>
              ⏱️
            </div>
            <div>
              <div className="item-title">{item.serviceName || "Authenticator"}</div>
              <span className="item-category-badge">
                {item.accountName || `${item.digits || 6}-Digit TOTP`}
              </span>
            </div>
          </div>

          <div className="item-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn"
              onClick={() => onSelect(item)}
              title="View Authenticator Details"
              aria-label="View Authenticator Details"
            >
              👁️
            </button>
            <button
              className="icon-btn"
              onClick={() => onEdit(item)}
              title="Edit Authenticator"
              aria-label="Edit Authenticator"
            >
              ✏️
            </button>
            <button
              className="icon-btn"
              onClick={() => onDelete(item.id)}
              title="Delete Authenticator"
              aria-label="Delete Authenticator"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Live Code Display */}
        <div className="totp-code-display" onClick={(e) => e.stopPropagation()}>
          <div className="totp-digits mono">{formattedCode}</div>
          <div className="totp-timer-ring">
            <span
              className="totp-timer-seconds mono"
              style={{
                color: totpData.remainingSeconds <= 5 ? "var(--accent-rose)" : "var(--accent-cyan)",
              }}
            >
              {totpData.remainingSeconds}s
            </span>
          </div>
        </div>

        {/* Copy 2FA Code Button */}
        <button
          className="btn btn-secondary btn-sm btn-block"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(totpData.code, item.serviceName);
          }}
          style={{ marginTop: "0.75rem" }}
          aria-label={`Copy 2FA code for ${item.serviceName}`}
        >
          📋 Copy 2FA Code
        </button>
      </div>
    </div>
  );
}

export default function TOTPView() {
  const {
    totpList,
    addTOTP,
    editTOTP,
    removeTOTP,
    itemsLoading,
    itemsError,
    refreshVaultData,
  } = useVault();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Client-side in-memory search across decrypted authenticators
  const filteredTotp = useMemo(() => {
    if (!searchQuery.trim()) return totpList;
    const q = searchQuery.toLowerCase();
    return totpList.filter((item) => {
      const matchService = item.serviceName?.toLowerCase().includes(q);
      const matchAccount = item.accountName?.toLowerCase().includes(q);
      return matchService || matchAccount;
    });
  }, [totpList, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTotp.length / ITEMS_PER_PAGE));
  const paginatedTotp = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTotp.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTotp, currentPage]);

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

  const handleCopy = (code, service) => {
    if (!code || code === "------") return;
    navigator.clipboard.writeText(code);
    toast.success(`${service || "2FA"} code copied to clipboard!`);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingItem) {
        await editTOTP(editingItem.id, formData);
        toast.success("2FA Authenticator updated!");
        if (detailItem && detailItem.id === editingItem.id) {
          setDetailItem({ ...detailItem, ...formData });
        }
      } else {
        await addTOTP(formData);
        toast.success("2FA Authenticator encrypted & added!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save TOTP authenticator.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setSaving(true);
      await removeTOTP(deleteConfirmId);
      toast.info("2FA Authenticator removed.");
      if (detailItem && detailItem.id === deleteConfirmId) {
        setDetailItem(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete TOTP authenticator.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 className="section-title">2FA Authenticator</h1>
            <span
              className="nav-badge"
              style={{
                color: "var(--accent-purple)",
                background: "rgba(168, 85, 247, 0.12)",
                border: "1px solid rgba(168, 85, 247, 0.25)",
              }}
            >
              {totpList.length} total
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Live RFC 6238 TOTP verification codes computed directly in browser memory
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => refreshVaultData()}
            disabled={itemsLoading}
            title="Refresh authenticators"
            aria-label="Refresh authenticators"
          >
            {itemsLoading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            aria-label="Add new 2FA authenticator"
          >
            + Add Authenticator
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

      {/* Search Input */}
      <div style={{ maxWidth: "440px", width: "100%", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="search"
          className="form-input"
          placeholder="🔍 Search service or account in memory..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
          aria-label="Search 2FA authenticators"
        />
      </div>

      {/* Loading state */}
      {itemsLoading && totpList.length === 0 ? (
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
            Decrypting 2FA authenticators in memory...
          </p>
        </div>
      ) : totpList.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">⏱️</div>
          <h3 className="empty-title">No 2FA authenticators configured</h3>
          <p className="empty-desc">
            Generate live 30-second verification codes directly in your zero-knowledge vault without relying on third-party mobile apps.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            + Add First Authenticator
          </button>
        </div>
      ) : filteredTotp.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No matching authenticators</h3>
          <p className="empty-desc">No 2FA authenticators matched query "{searchQuery}".</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            Reset Search
          </button>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {paginatedTotp.map((item) => (
              <TOTPCard
                key={item.id}
                item={item}
                onSelect={(it) => setDetailItem(it)}
                onEdit={(it) => {
                  setEditingItem(it);
                  setModalOpen(true);
                }}
                onDelete={(id) => setDeleteConfirmId(id)}
                onCopy={handleCopy}
              />
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
                Page {currentPage} of {totalPages} ({filteredTotp.length} authenticators)
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

      {/* Create / Edit Modal */}
      <TOTPModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        initialData={editingItem}
        loading={saving}
      />

      {/* Detail Inspection Modal */}
      <TOTPDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={(it) => {
          setEditingItem(it);
          setModalOpen(true);
        }}
        onDelete={(id) => setDeleteConfirmId(id)}
        onCopy={handleCopy}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete 2FA Authenticator"
        message="Are you sure you want to remove this 2FA Authenticator? You may lose access to your external account if you do not have alternative recovery codes."
        confirmText="Delete Authenticator"
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}
