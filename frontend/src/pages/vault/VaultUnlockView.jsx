import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function VaultUnlockView() {
  const { unlockVault } = useVault();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your Master Password.");
      return;
    }

    try {
      setLoading(true);
      await unlockVault(password);
      toast.success("Vault decrypted & unlocked!");
    } catch (err) {
      const errMsg =
        err.message === "Incorrect master password. Cryptographic authentication failed."
          ? "Incorrect Master Password. Cryptographic authentication failed."
          : err.response?.data?.message || err.message || "Failed to unlock vault. Please check your master password.";
      setError(errMsg);
      // Clear password field on error for safety
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-wrapper animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "75vh",
        padding: "1.5rem 1rem",
      }}
    >
      <div className="auth-card" style={{ maxWidth: "460px", width: "100%" }}>
        {/* Brand Header */}
        <div className="brand-header" style={{ marginBottom: "1.5rem" }}>
          <div
            className="brand-logo"
            style={{
              fontSize: "1.75rem",
              marginBottom: "0.75rem",
              background: "rgba(37, 99, 235, 0.15)",
              border: "1px solid rgba(37, 99, 235, 0.3)",
            }}
          >
            🔒
          </div>
          <h1 className="brand-title" style={{ fontSize: "1.375rem" }}>
            Unlock Secure Vault
          </h1>
          <p className="brand-tagline">
            Enter your Master Password to decrypt your stored secrets in memory
          </p>
        </div>

        {/* Security Badge */}
        <div
          style={{
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.2)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.125rem" }}>🛡️</span>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            <strong style={{ color: "var(--accent-sky)" }}>In-Memory Protection:</strong> Decryption key is derived locally and purged when locked.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="toast-card toast-error animate-fade-in"
            style={{ marginBottom: "1.25rem", width: "100%", maxWidth: "100%" }}
            role="alert"
          >
            <div className="toast-icon">✕</div>
            <div className="toast-content">
              <p className="toast-message">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Master Password Input */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="unlock-master-password">Master Password</label>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: 0, color: "var(--accent-cyan)" }}
                onClick={() => setHelpModalOpen(true)}
              >
                Forgot Password?
              </button>
            </div>
            <div className="form-input-wrapper">
              <input
                id="unlock-master-password"
                type={showPassword ? "text" : "password"}
                className="form-input mono"
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                className="form-input-addon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide master password" : "Show master password"}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !password}
            style={{ marginTop: "1.25rem", padding: "0.75rem 1.25rem" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                <span>Deriving Keys & Decrypting...</span>
              </div>
            ) : (
              "Unlock Vault 🔓"
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Zero-Knowledge Help Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Zero-Knowledge Recovery Information"
        maxWidth="480px"
        footer={
          <button className="btn btn-secondary btn-sm" onClick={() => setHelpModalOpen(false)}>
            Close
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
          <div
            style={{
              padding: "0.875rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "var(--radius-md)",
              color: "var(--accent-amber)",
              fontWeight: 600,
            }}
          >
            ⚠️ Master Passwords cannot be reset or recovered.
          </div>
          <p>
            SecurePass uses an uncompromising <strong>zero-knowledge cryptographic architecture</strong>:
          </p>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Your master password is used to derive your 256-bit Key Encryption Key (KEK).</li>
            <li>Neither your master password nor your unencrypted Vault Key (VEK) is ever sent to our servers.</li>
            <li>No administrator or recovery system has access to your keys.</li>
          </ul>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            If you have permanently forgotten your master password, you would need to reset your vault (which deletes all stored encrypted items) to start fresh.
          </p>
        </div>
      </Modal>
    </div>
  );
}
