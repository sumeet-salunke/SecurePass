import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function LoginView({ onSwitchToRegister, onSwitchToForgotPassword, onUnverifiedEmail }) {
  const { loginUser } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await loginUser(email, password);

      if (result?.mfaRequired) {
        toast.info("Multi-Factor Authentication required.");
      } else {
        toast.success("Welcome back to SecurePass!");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Login failed. Please check your credentials.";
      setError(errMsg);

      // If the backend returns account not verified, allow switching to verify OTP
      if (err.response?.status === 403 && errMsg.toLowerCase().includes("verify")) {
        onUnverifiedEmail(email);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="brand-header">
        <div className="brand-logo">🛡️</div>
        <h1 className="brand-title">Welcome Back</h1>
        <p className="brand-tagline">Enter your credentials to access your account</p>
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
        <label className="form-label" htmlFor="login-email">
          Email Address
        </label>
        <div className="form-input-wrapper">
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">
          <label htmlFor="login-password">Account Password</label>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: "0.75rem", padding: 0, color: "var(--accent-sky)" }}
            onClick={onSwitchToForgotPassword}
          >
            Forgot password?
          </button>
        </div>
        <div className="form-input-wrapper">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className="form-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="form-input-addon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? <div className="spinner" /> : "Sign In"}
      </button>

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="btn-ghost"
          style={{ color: "var(--accent-sky)", fontWeight: 600, padding: 0 }}
          onClick={onSwitchToRegister}
        >
          Create an account
        </button>
      </div>
    </form>
  );
}
