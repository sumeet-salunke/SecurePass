import { useState } from "react";
import { forgotPassword, resetPassword } from "../../api/authApi.js";
import { useToast } from "../../context/ToastContext.jsx";
import { calculatePasswordStrength } from "../../utils/crypto.js";

export default function ForgotPasswordView({ onSwitchToLogin }) {
  const toast = useToast();

  const [step, setStep] = useState(1); // 1 = request OTP, 2 = enter OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = calculatePasswordStrength(newPassword);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await forgotPassword({ email });
      toast.info(res?.message || "If an account exists, a reset code was sent to your email.");
      setStep(2);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to send reset code.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await resetPassword({ email, otp, newPassword });
      toast.success(res?.message || "Password reset successful! You can now sign in.");
      onSwitchToLogin();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Password reset failed. Check your OTP.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="brand-header">
        <div className="brand-logo">🔒</div>
        <h1 className="brand-title">Reset Password</h1>
        <p className="brand-tagline">
          {step === 1
            ? "Enter your email to receive a password recovery code"
            : "Enter the code sent to your email and choose a new password"}
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

      {step === 1 ? (
        <form onSubmit={handleRequestOtp}>
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              Account Email Address
            </label>
            <div className="form-input-wrapper">
              <input
                id="forgot-email"
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

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <div className="spinner" /> : "Send Recovery Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-otp">
              6-Digit Reset Code
            </label>
            <div className="form-input-wrapper">
              <input
                id="reset-otp"
                type="text"
                className="form-input mono"
                placeholder="123456"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">
              New Password (min 12 characters)
            </label>
            <div className="form-input-wrapper">
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            {newPassword && (
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
            <label className="form-label" htmlFor="reset-confirm-password">
              Confirm New Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="reset-confirm-password"
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
            {loading ? <div className="spinner" /> : "Save New Password"}
          </button>
        </form>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: "0.875rem", padding: 0 }}
          onClick={onSwitchToLogin}
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}
