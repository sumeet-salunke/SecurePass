import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";

// Base32 Alphabet validator (RFC 4648: A-Z, 2-7, optional = padding)
const BASE32_REGEX = /^[A-Z2-7]+=*$/i;

export default function TOTPModal({ isOpen, onClose, onSave, initialData = null, loading = false }) {
  const [serviceName, setServiceName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA1");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setServiceName(initialData.serviceName || "");
      setAccountName(initialData.accountName || "");
      setSecretKey(initialData.secretKey || "");
      setAlgorithm(initialData.algorithm || "SHA1");
      setDigits(initialData.digits || 6);
      setPeriod(initialData.period || 30);
      setError(null);
    } else {
      setServiceName("");
      setAccountName("");
      setSecretKey("");
      setAlgorithm("SHA1");
      setDigits(6);
      setPeriod(30);
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmedService = serviceName.trim();
    const trimmedAccount = accountName.trim();
    const sanitizedSecret = secretKey.trim().replace(/[\s-]/g, "").toUpperCase();

    if (!trimmedService) {
      setError("Service / Issuer name is required (e.g. GitHub, Google).");
      return;
    }

    if (trimmedService.length > 100) {
      setError("Service name must be 100 characters or fewer.");
      return;
    }

    if (!sanitizedSecret) {
      setError("Base32 secret key is required.");
      return;
    }

    if (!BASE32_REGEX.test(sanitizedSecret)) {
      setError("Invalid Base32 secret key. Allowed characters are A-Z and 2-7.");
      return;
    }

    setError(null);
    onSave({
      serviceName: trimmedService,
      accountName: trimmedAccount,
      secretKey: sanitizedSecret,
      algorithm,
      digits: Number(digits),
      period: Number(period),
    });
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit 2FA Authenticator" : "Add 2FA Authenticator"}
      maxWidth="560px"
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
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={loading || !serviceName.trim() || !secretKey.trim()}
              aria-label={initialData ? "Save Changes" : "Add Authenticator"}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                  Encrypting & Saving...
                </span>
              ) : initialData ? (
                "Save Changes"
              ) : (
                "Add Authenticator"
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
          <label htmlFor="totp-service-input" className="form-label">
            Service / Issuer Name <span style={{ color: "var(--accent-danger)" }}>*</span>
          </label>
          <input
            id="totp-service-input"
            type="text"
            className={`form-input ${error && !serviceName.trim() ? "input-error" : ""}`}
            placeholder="e.g. GitHub, AWS, Google, Discord"
            value={serviceName}
            maxLength={100}
            onChange={(e) => {
              setServiceName(e.target.value);
              if (error) setError(null);
            }}
            required
            autoFocus
            disabled={loading}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="totp-account-input" className="form-label">
            Account / Email Label
          </label>
          <input
            id="totp-account-input"
            type="text"
            className="form-input"
            placeholder="e.g. user@example.com, admin-root"
            value={accountName}
            maxLength={100}
            onChange={(e) => setAccountName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="totp-secret-input" className="form-label">
            Base32 Secret Key <span style={{ color: "var(--accent-danger)" }}>*</span>
          </label>
          <input
            id="totp-secret-input"
            type="text"
            className={`form-input mono ${error && (!secretKey.trim() || !BASE32_REGEX.test(secretKey.replace(/[\s-]/g, ""))) ? "input-error" : ""}`}
            placeholder="JBSWY3DPEHPK3PXP"
            value={secretKey}
            onChange={(e) => {
              setSecretKey(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            required
            disabled={loading}
            aria-required="true"
            autoComplete="off"
            spellCheck="false"
          />
          <p className="form-help-text" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Paste the alphanumeric setup key provided by the service 2FA setup screen (spaces/hyphens are stripped automatically).
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="totp-algo-select" className="form-label" style={{ fontSize: "0.8125rem" }}>
              Algorithm
            </label>
            <select
              id="totp-algo-select"
              className="form-input"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={loading}
              style={{ fontSize: "0.8125rem" }}
            >
              <option value="SHA1">SHA1 (Standard)</option>
              <option value="SHA256">SHA256</option>
              <option value="SHA512">SHA512</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="totp-digits-select" className="form-label" style={{ fontSize: "0.8125rem" }}>
              Digits
            </label>
            <select
              id="totp-digits-select"
              className="form-input"
              value={digits}
              onChange={(e) => setDigits(Number(e.target.value))}
              disabled={loading}
              style={{ fontSize: "0.8125rem" }}
            >
              <option value={6}>6 Digits</option>
              <option value={8}>8 Digits</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="totp-period-input" className="form-label" style={{ fontSize: "0.8125rem" }}>
              Period (Sec)
            </label>
            <input
              id="totp-period-input"
              type="number"
              className="form-input"
              min={15}
              max={120}
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              disabled={loading}
              style={{ fontSize: "0.8125rem" }}
            />
          </div>
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
            marginTop: "1.25rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            🔒 AES-256 Zero-Knowledge Encrypted
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-purple)" }}>
            RFC 6238 WebCrypto HMAC
          </span>
        </div>
      </form>
    </Modal>
  );
}
