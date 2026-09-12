import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { calculatePasswordStrength, validateMasterPasswordPolicy } from "../../utils/crypto.js";

export default function VaultSetupView() {
  const { setupNewVault } = useVault();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = calculatePasswordStrength(password);
  const policy = validateMasterPasswordPolicy(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please choose a Master Password.");
      return;
    }

    if (password.length < 12) {
      setError("Master Password must be at least 12 characters long for cryptographic security.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Master Passwords do not match. Please re-enter.");
      return;
    }

    if (!acknowledged) {
      setError("Please confirm you understand that lost master passwords cannot be recovered.");
      return;
    }

    try {
      setLoading(true);
      await setupNewVault(password);
      toast.success("Zero-Knowledge Encrypted Vault initialized successfully!");
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to initialize cryptographic vault. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    password.length >= 12 &&
    password === confirmPassword &&
    acknowledged &&
    !loading;

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
      <div className="auth-card" style={{ maxWidth: "520px", width: "100%" }}>
        {/* Brand Header */}
        <div className="brand-header" style={{ marginBottom: "1.5rem" }}>
          <div
            className="brand-logo"
            style={{
              fontSize: "1.75rem",
              marginBottom: "0.75rem",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            🛡️
          </div>
          <h1 className="brand-title" style={{ fontSize: "1.375rem" }}>
            Initialize Encrypted Vault
          </h1>
          <p className="brand-tagline">
            Create your Master Password to generate your zero-knowledge encryption key
          </p>
        </div>

        {/* Zero-Knowledge Security Notice */}
        <div
          style={{
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.22)",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: "0.1rem" }}>🔒</span>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
            <strong style={{ color: "var(--accent-sky)" }}>Zero-Knowledge Guarantee:</strong>
            {" "}All cryptographic keys are derived directly in your browser using PBKDF2 (100,000 rounds) and AES-256-GCM. Your master password is never transmitted to the server.
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
            <label className="form-label" htmlFor="setup-master-password">
              <span>Master Password</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Min 12 characters</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="setup-master-password"
                type={showPassword ? "text" : "password"}
                className="form-input mono"
                placeholder="Choose a strong, unique master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={loading}
                aria-describedby="password-policy-checklist"
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

            {/* Strength Meter */}
            {password && (
              <div style={{ marginTop: "0.6rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Strength Rating</span>
                  <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${strength.score}%`,
                      background: strength.color,
                      transition: "width 0.3s ease, background-color 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Password Policy Checklist */}
          <div
            id="password-policy-checklist"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.4rem",
              fontSize: "0.75rem",
            }}
          >
            <div style={{ color: policy.minLength ? "var(--accent-emerald)" : "var(--text-muted)" }}>
              {policy.minLength ? "✓" : "○"} At least 12 characters
            </div>
            <div style={{ color: policy.hasUpper ? "var(--accent-emerald)" : "var(--text-muted)" }}>
              {policy.hasUpper ? "✓" : "○"} Uppercase letter (A-Z)
            </div>
            <div style={{ color: policy.hasLower ? "var(--accent-emerald)" : "var(--text-muted)" }}>
              {policy.hasLower ? "✓" : "○"} Lowercase letter (a-z)
            </div>
            <div style={{ color: policy.hasNumber || policy.hasSymbol ? "var(--accent-emerald)" : "var(--text-muted)" }}>
              {policy.hasNumber || policy.hasSymbol ? "✓" : "○"} Number or Symbol
            </div>
          </div>

          {/* Confirm Master Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="setup-confirm-password">
              Confirm Master Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="setup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="form-input mono"
                placeholder="Repeat your master password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="form-input-addon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="form-help-text" style={{ color: "var(--accent-rose)" }}>
                ✕ Passwords do not match
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="form-help-text" style={{ color: "var(--accent-emerald)" }}>
                ✓ Passwords match
              </p>
            )}
          </div>

          {/* Security Acknowledgment Checkbox */}
          <div
            style={{
              background: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              marginBottom: "1.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                cursor: "pointer",
                fontSize: "0.8125rem",
                color: "var(--text-primary)",
                lineHeight: 1.45,
              }}
            >
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={loading}
                style={{
                  accentColor: "var(--accent-amber)",
                  width: "18px",
                  height: "18px",
                  marginTop: "0.15rem",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />
              <span>
                <strong style={{ color: "var(--accent-amber)" }}>Crucial Recovery Warning:</strong>{" "}
                I understand that SecurePass does not hold or store my Master Password. If I forget it, my vault contents are <strong>permanently irrecoverable</strong>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-emerald btn-block"
            disabled={!isFormValid}
            style={{ padding: "0.8rem 1.25rem", fontSize: "0.9375rem" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                <span>Deriving KEK & Initializing Vault...</span>
              </div>
            ) : (
              "Initialize Zero-Knowledge Vault ✨"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
