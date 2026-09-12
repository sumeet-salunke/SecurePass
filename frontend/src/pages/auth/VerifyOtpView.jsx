import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "../../api/authApi.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatErrorMessage } from "../../utils/errors.js";

export default function VerifyOtpView({ email, onVerified, onSwitchToLogin }) {
  const toast = useToast();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    if (error) setError("");
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pastedText.replace(/\D/g, "").slice(0, 6);
    if (digits) {
      setOtp(digits);
      if (error) setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const cleanEmail = email.trim();
      const res = await verifyOTP({ email: cleanEmail, otp });
      toast.success(res?.message || "Account verified successfully! You can now sign in.");
      onVerified();
    } catch (err) {
      const errMsg = formatErrorMessage(err, "Invalid or expired verification code.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      setError("");
      const cleanEmail = email.trim();
      const res = await resendOTP({ email: cleanEmail });
      toast.info(res?.message || "A new verification code has been sent.");
      setCooldown(60);
    } catch (err) {
      const errMsg = formatErrorMessage(err, "Failed to resend verification code.");
      setError(errMsg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="brand-header">
        <div className="brand-logo">📬</div>
        <h1 className="brand-title">Verify Email</h1>
        <p className="brand-tagline">
          We sent a 6-digit code to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
        </p>
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
        <label className="form-label" htmlFor="otp-input">
          6-Digit Verification Code
        </label>
        <div className="form-input-wrapper">
          <input
            id="otp-input"
            type="text"
            className="form-input mono"
            placeholder="123456"
            value={otp}
            maxLength={6}
            onChange={handleOtpChange}
            onPaste={handlePaste}
            disabled={loading}
            style={{ textAlign: "center", fontSize: "1.35rem", letterSpacing: "0.2em" }}
            required
            autoFocus
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
        {loading ? <div className="spinner" /> : "Verify Account"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: "0.875rem", padding: 0 }}
          onClick={onSwitchToLogin}
        >
          ← Back to Sign In
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{
            fontSize: "0.875rem",
            color: cooldown > 0 ? "var(--text-muted)" : "var(--accent-sky)",
            fontWeight: 600,
            padding: 0,
          }}
          onClick={handleResend}
          disabled={cooldown > 0 || resendLoading}
        >
          {resendLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
        </button>
      </div>
    </form>
  );
}
