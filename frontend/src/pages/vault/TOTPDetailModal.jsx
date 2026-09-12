import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";
import { generateTOTPCode } from "../../utils/crypto.js";

export default function TOTPDetailModal({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  onCopy,
}) {
  // Secret key is masked/protected by default for zero-knowledge safety
  const [revealed, setRevealed] = useState(false);
  const [totpData, setTotpData] = useState({ code: "------", remainingSeconds: 30, progress: 100 });

  // Reset revealed state when modal closes or active item changes
  useEffect(() => {
    if (!isOpen || !item) {
      setRevealed(false);
    }
  }, [isOpen, item?.id]);

  // Live OTP Code Generation Loop
  useEffect(() => {
    if (!isOpen || !item || !item.secretKey) return;

    let isMounted = true;
    const updateCode = async () => {
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
  }, [isOpen, item?.id, item?.secretKey, item?.algorithm, item?.digits, item?.period]);

  if (!item) return null;

  const formattedCode =
    totpData.code.length === 6
      ? `${totpData.code.slice(0, 3)} ${totpData.code.slice(3)}`
      : totpData.code.length === 8
      ? `${totpData.code.slice(0, 4)} ${totpData.code.slice(4)}`
      : totpData.code;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.serviceName || "2FA Authenticator"}
      maxWidth="540px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              onClose();
              onDelete(item.id);
            }}
            aria-label="Delete this 2FA authenticator"
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
              aria-label="Edit this 2FA authenticator"
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "rgba(168, 85, 247, 0.12)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            ⏱️
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {item.serviceName || "2FA Authenticator"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
              {item.accountName || "No account label"}
            </p>
          </div>
        </div>

        {/* Live OTP Verification Code Box */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Current Verification Code
          </div>

          <div
            className="mono"
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              color: "var(--accent-sky)",
              letterSpacing: "0.12em",
            }}
          >
            {formattedCode}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="totp-timer-ring" style={{ padding: "0.2rem 0.6rem" }}>
              <span
                className="totp-timer-seconds mono"
                style={{
                  color: totpData.remainingSeconds <= 5 ? "var(--accent-rose)" : "var(--accent-cyan)",
                  fontSize: "0.8125rem",
                }}
              >
                ⏱️ {totpData.remainingSeconds}s remaining
              </span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => onCopy(totpData.code, item.serviceName)}
              aria-label="Copy 2FA verification code"
            >
              📋 Copy Code
            </button>
          </div>
        </div>

        {/* Sensitive Base32 Secret Key Field */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Base32 Secret Key (Confidential)
            </label>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                className="icon-btn"
                onClick={() => setRevealed(!revealed)}
                title={revealed ? "Hide secret key" : "Reveal secret key"}
                aria-label={revealed ? "Hide secret key" : "Reveal secret key"}
              >
                {revealed ? "👁️" : "👁️‍🗨️"}
              </button>
              {revealed && (
                <button
                  className="icon-btn"
                  onClick={() => onCopy(item.secretKey, "Base32 Secret Key")}
                  title="Copy secret key"
                  aria-label="Copy secret key"
                >
                  📋
                </button>
              )}
            </div>
          </div>

          <div
            className="mono"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.6rem 0.85rem",
              fontSize: "0.875rem",
              color: revealed ? "var(--text-primary)" : "var(--text-muted)",
              letterSpacing: revealed ? "0.05em" : "0.15em",
              wordBreak: "break-all",
            }}
          >
            {revealed ? item.secretKey || "(Empty secret)" : "•••• •••• •••• ••••"}
          </div>
        </div>

        {/* Configuration Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem",
            fontSize: "0.8125rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Algorithm</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.algorithm || "SHA1"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Digits</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.digits || 6} Digits</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Period</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.period || 30} Seconds</span>
          </div>
        </div>

        {/* Timestamps */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "0.6rem",
          }}
        >
          <span>
            {item.createdAt ? `Added: ${new Date(item.createdAt).toLocaleDateString()}` : ""}
          </span>
          <span>
            {item.updatedAt ? `Last modified: ${new Date(item.updatedAt).toLocaleDateString()}` : ""}
          </span>
        </div>
      </div>
    </Modal>
  );
}
