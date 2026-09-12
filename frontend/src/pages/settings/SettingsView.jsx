import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  changePassword as apiChangePassword,
  changeEmail as apiChangeEmail,
  verifyEmailChange as apiVerifyEmailChange,
  setupMFA as apiSetupMFA,
  verifyMFASetup as apiVerifyMFASetup,
  disableMFA as apiDisableMFA,
  regenerateRecoveryCodes as apiRegenerateRecoveryCodes,
  getSessions as apiGetSessions,
  revokeSession as apiRevokeSession,
  logoutAllDevices as apiLogoutAllDevices,
  deleteAccount as apiDeleteAccount,
} from "../../api/authApi.js";
import Modal from "../../components/common/Modal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import { formatErrorMessage } from "../../utils/errors.js";
import { calculatePasswordStrength } from "../../utils/crypto.js";

export default function SettingsView({ initialSubTab = "password", onNavigateTab }) {
  const { user, setUser, logoutUser } = useAuth();
  const toast = useToast();

  // Active section tab: 'password' | 'email' | 'security' | 'sessions' | 'danger'
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Change Email state
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState(1); // 1 = enter new email, 2 = verify OTP
  const [emailLoading, setEmailLoading] = useState(false);

  // MFA State
  const [mfaQrCode, setMfaQrCode] = useState(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState(null);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaAction, setMfaAction] = useState(""); // 'setup' | 'disable' | 'regenerate'
  const [mfaConfirmPassword, setMfaConfirmPassword] = useState("");
  const [showMfaConfirmPassword, setShowMfaConfirmPassword] = useState(false);
  const [mfaConfirmCode, setMfaConfirmCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionActionId, setSessionActionId] = useState(null);
  const [revokeAllModalOpen, setRevokeAllModalOpen] = useState(false);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);

  // Delete Account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteMfaCode, setDeleteMfaCode] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const newPasswordStrength = calculatePasswordStrength(newPassword);

  // Fetch Sessions
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await apiGetSessions();
      setSessions(res.data?.sessions || []);
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to load active sessions."));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "sessions") {
      fetchSessions();
    }
  }, [activeSubTab]);

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      toast.error("New password must be at least 12 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      await apiChangePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully! Please sign in again with your new password.");
      logoutUser();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to change password. Please verify your current password."));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Request Email Change
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim();
    if (!cleanEmail) {
      toast.error("Please enter a valid new email address.");
      return;
    }

    try {
      setEmailLoading(true);
      const res = await apiChangeEmail({ currentPassword: emailCurrentPassword, newEmail: cleanEmail });
      toast.info(res?.message || "Verification code sent to your new email.");
      setEmailStep(2);
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to initiate email change. Verify your password."));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Verify Email Change
  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    if (emailOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setEmailLoading(true);
      await apiVerifyEmailChange({ code: emailOtp.trim() });
      toast.success("Email changed successfully! Please log in with your new email.");
      logoutUser();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Invalid email verification code."));
    } finally {
      setEmailLoading(false);
    }
  };

  // Start MFA Setup
  const handleStartMFASetup = async () => {
    try {
      setMfaLoading(true);
      const res = await apiSetupMFA();
      setMfaQrCode(res.data?.qrCode);
      setMfaAction("setup");
      setMfaModalOpen(true);
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to initialize MFA setup."));
    } finally {
      setMfaLoading(false);
    }
  };

  // Verify MFA Setup
  const handleVerifyMFASetup = async (e) => {
    e.preventDefault();
    if (mfaVerifyCode.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setMfaLoading(true);
      const res = await apiVerifyMFASetup({ code: mfaVerifyCode.trim() });
      setMfaRecoveryCodes(res.data?.recoveryCodes || []);
      toast.success("Two-Factor Authentication enabled!");
      setUser((prev) => ({ ...prev, mfaEnabled: true }));
    } catch (err) {
      toast.error(formatErrorMessage(err, "Invalid MFA code."));
    } finally {
      setMfaLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMFA = async (e) => {
    e.preventDefault();
    try {
      setMfaLoading(true);
      await apiDisableMFA({ password: mfaConfirmPassword, code: mfaConfirmCode.trim() });
      toast.success("Two-Factor Authentication disabled.");
      setUser((prev) => ({ ...prev, mfaEnabled: false }));
      setMfaModalOpen(false);
      setMfaConfirmPassword("");
      setMfaConfirmCode("");
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to disable MFA. Verify password and code."));
    } finally {
      setMfaLoading(false);
    }
  };

  // Regenerate Recovery Codes
  const handleRegenerateCodes = async (e) => {
    e.preventDefault();
    try {
      setMfaLoading(true);
      const res = await apiRegenerateRecoveryCodes({ password: mfaConfirmPassword, code: mfaConfirmCode.trim() });
      setMfaRecoveryCodes(res.data?.recoveryCodes || []);
      toast.success("New recovery codes generated!");
      setMfaConfirmPassword("");
      setMfaConfirmCode("");
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to regenerate codes. Verify password and code."));
    } finally {
      setMfaLoading(false);
    }
  };

  // Revoke Single Session
  const handleRevokeSession = async (sessionId) => {
    try {
      setSessionActionId(sessionId);
      await apiRevokeSession(sessionId);
      toast.info("Session revoked.");
      fetchSessions();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to revoke session."));
    } finally {
      setSessionActionId(null);
    }
  };

  // Revoke All Sessions / Logout All Devices
  const handleLogoutAllDevices = async () => {
    try {
      setRevokeAllLoading(true);
      await apiLogoutAllDevices();
      toast.info("All other device sessions revoked.");
      setRevokeAllModalOpen(false);
      fetchSessions();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to revoke all sessions."));
    } finally {
      setRevokeAllLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      setDeleteLoading(true);
      await apiDeleteAccount({
        currentPassword: deletePassword,
        code: deleteMfaCode.trim() || undefined,
      });
      toast.success("Your SecurePass account has been permanently deleted.");
      logoutUser();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete account. Verify your password."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyCodes = () => {
    if (!mfaRecoveryCodes) return;
    navigator.clipboard.writeText(mfaRecoveryCodes.join("\n"));
    toast.success("Recovery codes copied to clipboard!");
  };

  const handleSubTabChange = (tab) => {
    setActiveSubTab(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            Security & Account Settings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage master passwords, two-factor authentication, active sessions, and credentials
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigateTab && onNavigateTab("account")}
          title="Go to Account & Profile"
        >
          👤 Account Profile
        </button>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-sidebar">
          <nav className="settings-subtabs" aria-label="Settings Navigation">
            <button
              className={`nav-item ${activeSubTab === "password" ? "active" : ""}`}
              onClick={() => handleSubTabChange("password")}
              aria-current={activeSubTab === "password" ? "page" : undefined}
            >
              <div className="nav-item-left">
                <span>🔑</span>
                <span>Change Password</span>
              </div>
            </button>

            <button
              className={`nav-item ${activeSubTab === "email" ? "active" : ""}`}
              onClick={() => handleSubTabChange("email")}
              aria-current={activeSubTab === "email" ? "page" : undefined}
            >
              <div className="nav-item-left">
                <span>✉️</span>
                <span>Change Email</span>
              </div>
            </button>

            <button
              className={`nav-item ${activeSubTab === "security" ? "active" : ""}`}
              onClick={() => handleSubTabChange("security")}
              aria-current={activeSubTab === "security" ? "page" : undefined}
            >
              <div className="nav-item-left">
                <span>🛡️</span>
                <span>Two-Factor Auth</span>
              </div>
              {user?.mfaEnabled && <span className="nav-badge" style={{ color: "var(--accent-emerald)" }}>ON</span>}
            </button>

            <button
              className={`nav-item ${activeSubTab === "sessions" ? "active" : ""}`}
              onClick={() => handleSubTabChange("sessions")}
              aria-current={activeSubTab === "sessions" ? "page" : undefined}
            >
              <div className="nav-item-left">
                <span>📱</span>
                <span>Active Sessions</span>
              </div>
            </button>

            <button
              className={`nav-item ${activeSubTab === "danger" ? "active" : ""}`}
              onClick={() => handleSubTabChange("danger")}
              style={{ color: "var(--accent-rose)" }}
              aria-current={activeSubTab === "danger" ? "page" : undefined}
            >
              <div className="nav-item-left">
                <span>⚠️</span>
                <span>Delete Account</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* CHANGE PASSWORD */}
          {activeSubTab === "password" && (
            <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem", background: "var(--bg-surface)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Change Master Password
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                Updating your account password will invalidate all existing sessions across other devices.
              </p>

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-current-pwd">
                    Current Password
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="settings-current-pwd"
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="form-input-addon"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-new-pwd">
                    New Password (min 12 chars)
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="settings-new-pwd"
                      type={showNewPassword ? "text" : "password"}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordLoading}
                      placeholder="••••••••••••"
                      required
                      minLength={12}
                    />
                    <button
                      type="button"
                      className="form-input-addon"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? "Hide password" : "Show password"}
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    >
                      {showNewPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Strength</span>
                        <span style={{ color: newPasswordStrength.color, fontWeight: 600 }}>{newPasswordStrength.label}</span>
                      </div>
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${newPasswordStrength.score}%`,
                            background: newPasswordStrength.color,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="form-label">
                    <label htmlFor="settings-confirm-pwd">Confirm New Password</label>
                    {confirmPassword && (
                      <span style={{ fontSize: "0.75rem", color: newPassword === confirmPassword ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                        {newPassword === confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                      </span>
                    )}
                  </div>
                  <div className="form-input-wrapper">
                    <input
                      id="settings-confirm-pwd"
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordLoading}
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="form-input-addon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading || newPassword.length < 12 || newPassword !== confirmPassword}
                >
                  {passwordLoading ? <div className="spinner" /> : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* CHANGE EMAIL */}
          {activeSubTab === "email" && (
            <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem", background: "var(--bg-surface)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Change Account Email
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                Current Email: <strong style={{ color: "var(--text-primary)" }}>{user?.email || "Unknown"}</strong>
              </p>

              {emailStep === 1 ? (
                <form onSubmit={handleRequestEmailChange}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="settings-new-email">New Email Address</label>
                    <input
                      id="settings-new-email"
                      type="email"
                      className="form-input"
                      placeholder="newemail@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="settings-email-pwd">Current Password</label>
                    <div className="form-input-wrapper">
                      <input
                        id="settings-email-pwd"
                        type={showEmailCurrentPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••••••"
                        value={emailCurrentPassword}
                        onChange={(e) => setEmailCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="form-input-addon"
                        onClick={() => setShowEmailCurrentPassword(!showEmailCurrentPassword)}
                        title={showEmailCurrentPassword ? "Hide password" : "Show password"}
                        aria-label={showEmailCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showEmailCurrentPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                    {emailLoading ? <div className="spinner" /> : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailChange}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="settings-email-otp">
                      Verification Code sent to {newEmail}
                    </label>
                    <input
                      id="settings-email-otp"
                      type="text"
                      className="form-input mono"
                      placeholder="123456"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                      {emailLoading ? <div className="spinner" /> : "Confirm Email Change"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setEmailStep(1)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TWO-FACTOR AUTHENTICATION */}
          {activeSubTab === "security" && (
            <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem", background: "var(--bg-surface)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Two-Factor Authentication (2FA)
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                Require a 6-digit authenticator code (TOTP) from your device during sign-in.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Authenticator Status</div>
                  <div style={{ fontSize: "0.75rem", color: user?.mfaEnabled ? "var(--accent-emerald)" : "var(--text-muted)", marginTop: "0.125rem" }}>
                    {user?.mfaEnabled ? "● Enabled & Protected" : "○ Currently Disabled"}
                  </div>
                </div>

                {!user?.mfaEnabled ? (
                  <button className="btn btn-primary btn-sm" onClick={handleStartMFASetup} disabled={mfaLoading}>
                    Enable 2FA
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setMfaAction("regenerate");
                        setMfaModalOpen(true);
                      }}
                    >
                      Regenerate Codes
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        setMfaAction("disable");
                        setMfaModalOpen(true);
                      }}
                    >
                      Disable 2FA
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE SESSIONS */}
          {activeSubTab === "sessions" && (
            <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem", background: "var(--bg-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Active Sessions</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                    Authorized device sessions for your account
                  </p>
                </div>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setRevokeAllModalOpen(true)}
                  disabled={sessions.length === 0}
                >
                  Revoke All Other Devices
                </button>
              </div>

              {sessionsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                  <div className="spinner" />
                </div>
              ) : sessions.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
                  No additional sessions detected.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 0.875rem",
                        background: "var(--bg-input)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          Session: <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sess.id.slice(0, 12)}...</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Created: {new Date(sess.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRevokeSession(sess.id)}
                        disabled={sessionActionId === sess.id}
                      >
                        {sessionActionId === sess.id ? <div className="spinner" style={{ width: "14px", height: "14px" }} /> : "Revoke"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE / DELETE ACCOUNT */}
          {activeSubTab === "danger" && (
            <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem", background: "var(--bg-surface)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent-rose)", marginBottom: "0.35rem" }}>
                Delete Account
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                Permanently delete your SecurePass identity and authorization tokens. This action is irreversible.
              </p>

              <button className="btn btn-danger btn-sm" onClick={() => setDeleteModalOpen(true)}>
                Permanently Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MFA SETUP / ACTION MODAL */}
      <Modal
        isOpen={mfaModalOpen}
        onClose={() => {
          setMfaModalOpen(false);
          setMfaRecoveryCodes(null);
          setMfaQrCode(null);
          setMfaVerifyCode("");
          setMfaConfirmPassword("");
          setMfaConfirmCode("");
        }}
        title={
          mfaAction === "setup"
            ? "Configure Two-Factor Authentication"
            : mfaAction === "disable"
            ? "Disable Two-Factor Authentication"
            : "Regenerate Backup Recovery Codes"
        }
        maxWidth="480px"
      >
        {mfaRecoveryCodes ? (
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "0.875rem" }}>
              ⚠️ Save these single-use recovery codes in a safe place. You will need them if you lose access to your authenticator app.
            </p>
            <div
              className="mono"
              style={{
                background: "var(--bg-input)",
                padding: "0.875rem",
                borderRadius: "var(--radius-md)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "var(--accent-sky)",
                marginBottom: "1rem",
              }}
            >
              {mfaRecoveryCodes.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={copyCodes}>
              📋 Copy All Recovery Codes
            </button>
          </div>
        ) : mfaAction === "setup" ? (
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              Scan this QR code with an authenticator app (e.g. Google Authenticator), then enter the 6-digit code:
            </p>
            {mfaQrCode && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", padding: "0.75rem", background: "#ffffff", borderRadius: "var(--radius-md)" }}>
                <img src={mfaQrCode} alt="MFA QR Code" style={{ width: "160px", height: "160px" }} />
              </div>
            )}
            <form onSubmit={handleVerifyMFASetup}>
              <div className="form-group">
                <label className="form-label" htmlFor="mfa-verify-code">6-Digit Code</label>
                <input
                  id="mfa-verify-code"
                  type="text"
                  className="form-input mono"
                  placeholder="123456"
                  maxLength={6}
                  value={mfaVerifyCode}
                  onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={mfaLoading}>
                {mfaLoading ? <div className="spinner" /> : "Verify & Enable 2FA"}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={mfaAction === "disable" ? handleDisableMFA : handleRegenerateCodes}>
            <div className="form-group">
              <label className="form-label" htmlFor="mfa-confirm-pwd">Account Password</label>
              <div className="form-input-wrapper">
                <input
                  id="mfa-confirm-pwd"
                  type={showMfaConfirmPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={mfaConfirmPassword}
                  onChange={(e) => setMfaConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="form-input-addon"
                  onClick={() => setShowMfaConfirmPassword(!showMfaConfirmPassword)}
                  title={showMfaConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showMfaConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showMfaConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="mfa-confirm-code">6-Digit Authenticator Code</label>
              <input
                id="mfa-confirm-code"
                type="text"
                className="form-input mono"
                placeholder="123456"
                maxLength={6}
                value={mfaConfirmCode}
                onChange={(e) => setMfaConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn ${mfaAction === "disable" ? "btn-danger" : "btn-primary"} btn-block`}
              disabled={mfaLoading}
            >
              {mfaLoading ? <div className="spinner" /> : mfaAction === "disable" ? "Confirm Disable 2FA" : "Regenerate Codes"}
            </button>
          </form>
        )}
      </Modal>

      {/* DELETE ACCOUNT MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword("");
          setDeleteMfaCode("");
        }}
        title="Delete Account Confirmation"
        maxWidth="440px"
      >
        <form onSubmit={handleDeleteAccount}>
          <p style={{ color: "var(--accent-rose)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
            ⚠️ This will permanently delete your account and revoke all sessions.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="delete-account-pwd">Account Password</label>
            <div className="form-input-wrapper">
              <input
                id="delete-account-pwd"
                type={showDeletePassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••••••"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="form-input-addon"
                onClick={() => setShowDeletePassword(!showDeletePassword)}
                title={showDeletePassword ? "Hide password" : "Show password"}
                aria-label={showDeletePassword ? "Hide password" : "Show password"}
              >
                {showDeletePassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {user?.mfaEnabled && (
            <div className="form-group">
              <label className="form-label" htmlFor="delete-account-mfa">6-Digit Authenticator Code</label>
              <input
                id="delete-account-mfa"
                type="text"
                className="form-input mono"
                placeholder="123456"
                maxLength={6}
                value={deleteMfaCode}
                onChange={(e) => setDeleteMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                required
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="submit" className="btn btn-danger btn-block" disabled={deleteLoading}>
              {deleteLoading ? <div className="spinner" /> : "Permanently Delete Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* REVOKE ALL SESSIONS CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={revokeAllModalOpen}
        onClose={() => setRevokeAllModalOpen(false)}
        onConfirm={handleLogoutAllDevices}
        title="Revoke All Other Sessions"
        message="Are you sure you want to revoke all other active sessions? All other logged-in devices will be signed out immediately."
        confirmText="Revoke All Devices"
        confirmVariant="danger"
        loading={revokeAllLoading}
      />
    </div>
  );
}
