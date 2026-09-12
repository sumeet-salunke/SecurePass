import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function MFAChallengeView() {
  const { completeMFALogin, completeRecoveryLogin, cancelMFAChallenge } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState("totp"); // 'totp' | 'recovery'
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (mode === "totp") {
        if (code.length !== 6) {
          setError("Please enter the 6-digit authenticator code.");
          return;
        }
        await completeMFALogin(code);
        toast.success("MFA verified! Welcome back.");
      } else {
        if (!recoveryCode.trim()) {
          setError("Please enter a recovery code.");
          return;
        }
        await completeRecoveryLogin(recoveryCode.trim());
        toast.success("Recovery code verified! Session restored.");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        (mode === "totp" ? "Invalid authenticator code." : "Invalid recovery code.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="brand-header">
        <div className="brand-logo">{mode === "totp" ? "🔐" : "🔑"}</div>
        <h1 className="brand-title">
          {mode === "totp" ? "Two-Factor Authentication" : "Recovery Code Sign In"}
        </h1>
        <p className="brand-tagline">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app"
            : "Enter one of your single-use backup recovery codes"}
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

      {mode === "totp" ? (
        <div className="form-group">
          <label className="form-label" htmlFor="mfa-code">
            6-Digit Authenticator Code
          </label>
          <div className="form-input-wrapper">
            <input
              id="mfa-code"
              type="text"
              className="form-input mono"
              placeholder="123456"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{ textAlign: "center", fontSize: "1.35rem", letterSpacing: "0.2em" }}
              required
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label" htmlFor="recovery-code">
            Recovery Code
          </label>
          <div className="form-input-wrapper">
            <input
              id="recovery-code"
              type="text"
              className="form-input mono"
              placeholder="XXXXX-XXXXX"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              style={{ textAlign: "center", fontSize: "1.15rem", letterSpacing: "0.1em" }}
              required
              autoFocus
            />
          </div>
          <p className="form-help-text">
            Each recovery code can only be used once to bypass authenticator access.
          </p>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? <div className="spinner" /> : mode === "totp" ? "Verify & Sign In" : "Use Recovery Code"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: "0.875rem", padding: 0 }}
          onClick={cancelMFAChallenge}
        >
          ← Cancel
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: "0.875rem", color: "var(--accent-sky)", fontWeight: 600, padding: 0 }}
          onClick={() => {
            setError("");
            setMode(mode === "totp" ? "recovery" : "totp");
          }}
        >
          {mode === "totp" ? "Use recovery code" : "Use authenticator app"}
        </button>
      </div>
    </form>
  );
}
