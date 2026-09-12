import { useState } from "react";
import { useVault } from "../../context/VaultContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { calculatePasswordStrength } from "../../utils/crypto.js";

export default function VaultUnlockOverlay() {
  const { hasVault, unlockVault, setupNewVault } = useVault();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFirstTimeSetup = hasVault === false;
  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your Master Password.");
      return;
    }

    if (isFirstTimeSetup) {
      if (password.length < 12) {
        setError("Master Password must be at least 12 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setLoading(true);
      if (isFirstTimeSetup) {
        await setupNewVault(password);
        toast.success("Cryptographic vault created and unlocked!");
      } else {
        await unlockVault(password);
        toast.success("Vault unlocked successfully!");
      }
    } catch (err) {
      const errMsg =
        err.message ||
        (isFirstTimeSetup
          ? "Failed to setup vault. Please try again."
          : "Invalid Master Password or corrupted encryption key.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh" }}>
      <div className="auth-card" style={{ maxWidth: "460px" }}>
        <div className="brand-header">
          <div className="brand-logo">{isFirstTimeSetup ? "✨" : "🔒"}</div>
          <h1 className="brand-title">
            {isFirstTimeSetup ? "Setup Secure Vault" : "Unlock Your Vault"}
          </h1>
          <p className="brand-tagline">
            {isFirstTimeSetup
              ? "Set a master password to encrypt your zero-knowledge vault"
              : "Enter your master password to decrypt your credentials"}
          </p>
        </div>

        {error && (
          <div className="toast-card toast-error" style={{ marginBottom: "1.25rem", width: "100%", maxWidth: "100%" }}>
            <div className="toast-icon">✕</div>
            <div className="toast-content">
              <p className="toast-message">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="vault-master-password">
              {isFirstTimeSetup ? "Master Encryption Password (min 12 chars)" : "Master Password"}
            </label>
            <div className="form-input-wrapper">
              <input
                id="vault-master-password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="form-input-addon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {isFirstTimeSetup && password && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Strength</span>
                  <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${strength.score}%`,
                      background: strength.color,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {isFirstTimeSetup && (
            <div className="form-group">
              <label className="form-label" htmlFor="vault-confirm-password">
                Confirm Master Password
              </label>
              <div className="form-input-wrapper">
                <input
                  id="vault-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <p className="form-help-text" style={{ color: "var(--accent-amber)" }}>
                ⚠️ Important: If you lose your master password, your vault data cannot be recovered.
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`btn ${isFirstTimeSetup ? "btn-emerald" : "btn-primary"} btn-block`}
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : isFirstTimeSetup ? "Initialize Secure Vault" : "Unlock Vault"}
          </button>
        </form>
      </div>
    </div>
  );
}
