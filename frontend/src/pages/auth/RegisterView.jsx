import { useState } from "react";
import { register } from "../../api/authApi.js";
import { calculatePasswordStrength } from "../../utils/crypto.js";
import { useToast } from "../../context/ToastContext.jsx";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 12) {
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
      const res = await register({ name, email, password });
      toast.success(res?.message || "Account created! Verification code sent to your email.");
      onRegistered(email);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Registration failed.";
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
        <div className="toast-card toast-error" style={{ marginBottom: "1.25rem", width: "100%", maxWidth: "100%" }}>
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

      <div className="form-group">
        <label className="form-label" htmlFor="reg-confirm-password">
          Confirm Password
        </label>
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
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
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
