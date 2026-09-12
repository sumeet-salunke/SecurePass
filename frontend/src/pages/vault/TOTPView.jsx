import { useState, useEffect } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { generateTOTPCode } from "../../utils/crypto.js";
import TOTPModal from "./TOTPModal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

function TOTPCard({ item, onEdit, onDelete, onCopy }) {
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
      : totpData.code;

  return (
    <div className="item-card totp-card">
      <div>
        <div className="item-card-header">
          <div className="item-avatar-title">
            <div className="item-avatar" style={{ color: "var(--accent-purple)" }}>
              ⏱️
            </div>
            <div>
              <div className="item-title">{item.serviceName || "Authenticator"}</div>
              <span className="item-category-badge">{item.accountName || "2FA Code"}</span>
            </div>
          </div>

          <div className="item-actions">
            <button className="icon-btn" onClick={() => onEdit(item)} title="Edit Authenticator">
              ✏️
            </button>
            <button className="icon-btn" onClick={() => onDelete(item.id)} title="Delete Authenticator">
              🗑️
            </button>
          </div>
        </div>

        <div className="totp-code-display">
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

        <button
          className="btn btn-secondary btn-sm btn-block"
          onClick={() => onCopy(totpData.code, item.serviceName)}
          style={{ marginTop: "0.5rem" }}
        >
          📋 Copy 2FA Code
        </button>
      </div>
    </div>
  );
}

export default function TOTPView({ searchQuery = "" }) {
  const { totpList, addTOTP, editTOTP, removeTOTP } = useVault();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredTotp = totpList.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchService = item.serviceName?.toLowerCase().includes(q);
      const matchAccount = item.accountName?.toLowerCase().includes(q);
      return matchService || matchAccount;
    }
    return true;
  });

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
      } else {
        await addTOTP(formData);
        toast.success("2FA Authenticator added!");
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err.message || "Failed to save TOTP authenticator.");
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
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete TOTP.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">2FA Authenticator</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Live TOTP codes calculated directly in browser using Web Crypto HMAC
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          + Add Authenticator
        </button>
      </div>

      {filteredTotp.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <div className="empty-icon">⏱️</div>
          <h3 className="empty-title">No 2FA authenticators configured</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No authenticators match "${searchQuery}"`
              : "Generate live 30-second verification codes without needing a phone app."}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            Add First Authenticator
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {filteredTotp.map((item) => (
            <TOTPCard
              key={item.id}
              item={item}
              onEdit={(it) => {
                setEditingItem(it);
                setModalOpen(true);
              }}
              onDelete={(id) => setDeleteConfirmId(id)}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

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

      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete 2FA Authenticator"
        message="Are you sure you want to remove this 2FA Authenticator? You may lose access to your external account if you do not have a backup."
        confirmText="Delete Authenticator"
        loading={saving}
      />
    </div>
  );
}
