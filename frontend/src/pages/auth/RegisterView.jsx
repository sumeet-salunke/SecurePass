import { useState } from "react";
import { register } from "../../api/authApi.js";
import { calculatePasswordStrength } from "../../utils/crypto.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatErrorMessage } from "../../utils/errors.js";

export default function RegisterView({ onSwitchToLogin, onRegistered }) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = calculatePasswordStrength(password);

  const hasMinLength = password.length >= 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters long.");
      return;
    }

    if (!hasMinLength) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const cleanEmail = email.trim();
      const res = await register({ name: name.trim(), email: cleanEmail, password });
      toast.success(res?.message || "Account created! Verification code sent to your email.");
      onRegistered(cleanEmail);
    } catch (err) {
      const errMsg = formatErrorMessage(err, "Registration failed. Please try again.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="brand-header">
        <div className="brand-logo">🛡️</div>
        <h1 className="brand-title">Create Account</h1>
        <p className="brand-tagline">Set up your secure SecurePass account</p>
      </div>

      {error && (
        <div className="toast-card toast-error" role="alert" aria-live="assertive" style={{ marginBottom: "1.25rem", width: "100%", maxWidth: "100%" }}>
          <div className="toast-icon">✕</div>
          <div className="toast-content">
            <p className="toast-message">{error}</p>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="reg-name">
          Full Name
        </label>
        <div className="form-input-wrapper">
          <input
            id="reg-name"
            type="text"
            className="form-input"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={50}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">
          Email Address
        </label>
        <div className="form-input-wrapper">
          <input
            id="reg-email"
            type="email"
            className="form-input"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-password">
          Password (min. 12 characters)
        </label>
        <div className="form-input-wrapper">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            className="form-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
          />
          <button
            type="button"
            className="form-input-addon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        {password && (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Strength</span>
              <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div
                style={{
                  height: "100%",
                  width: `${strength.score}%`,
                  background: strength.color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", fontSize: "0.6875rem" }}>
              <span style={{ color: hasMinLength ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                {hasMinLength ? "✓" : "○"} 12+ chars
              </span>
              <span style={{ color: hasUpperCase ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                {hasUpperCase ? "✓" : "○"} Uppercase
              </span>
              <span style={{ color: hasLowerCase ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                {hasLowerCase ? "✓" : "○"} Lowercase
              </span>
              <span style={{ color: hasNumber ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                {hasNumber ? "✓" : "○"} Number
              </span>
              <span style={{ color: hasSpecial ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                {hasSpecial ? "✓" : "○"} Special char
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <div className="form-label">
          <label htmlFor="reg-confirm-password">Confirm Password</label>
          {confirmPassword && (
            <span style={{ fontSize: "0.75rem", color: passwordsMatch ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
              {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
            </span>
          )}
        </div>
        <div className="form-input-wrapper">
          <input
            id="reg-confirm-password"
            type={showPassword ? "text" : "password"}
            className="form-input"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="form-input-addon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading || !isPasswordValid || !passwordsMatch || !name.trim() || !email.trim()}
      >
        {loading ? <div className="spinner" /> : "Create Account"}
      </button>

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <button
          type="button"
          className="btn-ghost"
          style={{ color: "var(--accent-sky)", fontWeight: 600, padding: 0 }}
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
