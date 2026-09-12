import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  getSessions as apiGetSessions,
  revokeSession as apiRevokeSession,
  logoutAllDevices as apiLogoutAllDevices,
  deleteAccount as apiDeleteAccount,
} from "../../api/authApi.js";
import Modal from "../../components/common/Modal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import { formatErrorMessage } from "../../utils/errors.js";

export default function AccountProfileView({ onNavigateTab }) {
  const { user, logoutUser } = useAuth();
  const toast = useToast();

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [sessionActionId, setSessionActionId] = useState(null);
  const [revokeAllModalOpen, setRevokeAllModalOpen] = useState(false);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteMfaCode, setDeleteMfaCode] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copied Account ID state
  const [copiedId, setCopiedId] = useState(false);

  // Fetch active sessions
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const res = await apiGetSessions();
      setSessions(res.data?.sessions || []);
    } catch (err) {
      const msg = formatErrorMessage(err, "Failed to load active sessions.");
      setSessionsError(msg);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Copy User ID
  const handleCopyUserId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("Account ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Revoke single session
  const handleRevokeSession = async (sessionId) => {
    try {
      setSessionActionId(sessionId);
      await apiRevokeSession(sessionId);
      toast.success("Session revoked successfully.");
      fetchSessions();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to revoke session."));
    } finally {
      setSessionActionId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllSessions = async () => {
    try {
      setRevokeAllLoading(true);
      await apiLogoutAllDevices();
      toast.success("All other active device sessions revoked.");
      setRevokeAllModalOpen(false);
      fetchSessions();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to revoke sessions."));
    } finally {
      setRevokeAllLoading(false);
    }
  };

  // Delete account confirmation
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Please enter your current account password.");
      return;
    }

    try {
      setDeleteLoading(true);
      await apiDeleteAccount({
        currentPassword: deletePassword,
        code: deleteMfaCode.trim() || undefined,
      });
      toast.success("Your SecurePass account has been permanently deleted.");
      logoutUser();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete account. Please verify your password."));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate Security Posture
  const securityChecks = [
    { label: "Account Email Verified", passed: true, detail: "Confirmed with secure OTP verification" },
    { label: "Master Password Configured", passed: true, detail: "Argon2id cryptographic hash protection" },
    {
      label: "Two-Factor Authentication",
      passed: Boolean(user?.mfaEnabled),
      detail: user?.mfaEnabled ? "TOTP authenticator protection active" : "Recommended: enable authenticator 2FA",
      actionLabel: user?.mfaEnabled ? "Manage 2FA" : "Enable 2FA",
      actionTab: "security",
    },
    { label: "In-Memory Token Protection", passed: true, detail: "Tokens never written to persistent local storage" },
  ];

  const passedCount = securityChecks.filter((c) => c.passed).length;
  const securityScore = Math.round((passedCount / securityChecks.length) * 100);

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: "1.75rem" }}>
        <div>
          <h1 className="section-title" style={{ fontSize: "1.5rem" }}>
            Account & Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            View your verified identity, security posture, and manage active device authorizations
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab("security")}
            title="Configure Security Settings"
          >
            🛡️ Security Settings
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={logoutUser}
            title="Sign out of current device"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div
        className="dashboard-card"
        style={{
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(15, 26, 54, 0.95) 100%)",
          border: "1px solid var(--border-subtle)",
          padding: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Avatar with status badge */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, var(--accent-primary) 0%, #38bdf8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#ffffff",
                boxShadow: "0 0 20px rgba(37, 99, 235, 0.35)",
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div
              title="Verified Account"
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "22px",
                height: "22px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-emerald)",
                border: "2px solid var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "#ffffff",
              }}
            >
              ✓
            </div>
          </div>

          {/* User Details */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {user?.name || "SecurePass User"}
              </h2>
              <span className="status-pill status-pill-emerald">
                ✓ Verified Account
              </span>
              {user?.mfaEnabled && (
                <span className="status-pill status-pill-blue">
                  🛡️ 2FA Enabled
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                marginTop: "0.5rem",
                flexWrap: "wrap",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>✉️</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{user?.email || ""}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "0.15rem 0.4rem", fontSize: "0.75rem", color: "var(--accent-sky)" }}
                  onClick={() => onNavigateTab("email")}
                >
                  Change
                </button>
              </div>

              {user?.id && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span>🆔</span>
                  <span className="mono" style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {user.id.slice(0, 10)}...
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "0.15rem 0.4rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}
                    onClick={handleCopyUserId}
                    title="Copy full User ID"
                  >
                    {copiedId ? "✓ Copied" : "Copy ID"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity & Account Note */}
        <div
          style={{
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            <span>🔒 Security Identity: </span>
            <span style={{ color: "var(--text-secondary)" }}>
              Name is registered to your cryptographic authentication profile.
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="status-pill status-pill-blue" style={{ fontSize: "0.6875rem" }}>
              Personal Vault
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Security Posture & Quick Settings Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Security Health Score Card */}
        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div className="card-header" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="card-icon">🛡️</span>
              <span className="card-title">Security Posture</span>
            </div>
            <span
              className={`status-pill ${securityScore === 100 ? "status-pill-emerald" : "status-pill-amber"}`}
            >
              {securityScore}% Health
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                height: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${securityScore}%`,
                  background: securityScore === 100 ? "var(--accent-emerald)" : "var(--accent-amber)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Security Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {securityChecks.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.625rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                  <span
                    style={{
                      color: item.passed ? "var(--accent-emerald)" : "var(--accent-amber)",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      marginTop: "1px",
                    }}
                  >
                    {item.passed ? "✓" : "⚠️"}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item.detail}
                    </div>
                  </div>
                </div>

                {item.actionLabel && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                    onClick={() => onNavigateTab(item.actionTab)}
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings Quick Access */}
        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div className="card-header" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="card-icon">⚙️</span>
              <span className="card-title">Security Navigation</span>
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
            Direct shortcuts to configure authentication credentials, multi-factor keys, and sessions:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: "flex-start", padding: "0.875rem", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}
              onClick={() => onNavigateTab("password")}
            >
              <span style={{ fontSize: "1.125rem" }}>🔑</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Change Password</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400 }}>Update master password</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: "flex-start", padding: "0.875rem", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}
              onClick={() => onNavigateTab("email")}
            >
              <span style={{ fontSize: "1.125rem" }}>✉️</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Change Email</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400 }}>Verify new email address</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: "flex-start", padding: "0.875rem", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}
              onClick={() => onNavigateTab("security")}
            >
              <span style={{ fontSize: "1.125rem" }}>🛡️</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Two-Factor Auth</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400 }}>TOTP keys & recovery</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: "flex-start", padding: "0.875rem", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}
              onClick={() => onNavigateTab("sessions")}
            >
              <span style={{ fontSize: "1.125rem" }}>📱</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Active Sessions</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400 }}>Manage authorized devices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Device Sessions List */}
      <div className="dashboard-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="card-icon">📱</span>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Active Sessions ({sessions.length})
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.15rem" }}>
              Devices authorized to access your SecurePass account
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchSessions}
              disabled={sessionsLoading}
              title="Refresh sessions list"
            >
              {sessionsLoading ? <div className="spinner" style={{ width: "12px", height: "12px" }} /> : "🔄 Refresh"}
            </button>

            {sessions.length > 1 && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setRevokeAllModalOpen(true)}
                disabled={sessionsLoading}
              >
                Revoke All Other Devices
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {sessionsLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 0", gap: "0.75rem" }}>
            <div className="spinner" style={{ width: "24px", height: "24px" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Loading active sessions...</span>
          </div>
        )}

        {/* Error State */}
        {!sessionsLoading && sessionsError && (
          <div
            style={{
              padding: "1rem",
              background: "var(--accent-rose-subtle)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "0.8125rem", color: "var(--accent-rose)" }}>
              ⚠️ {sessionsError}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchSessions}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!sessionsLoading && !sessionsError && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            <p>No additional active device sessions found.</p>
          </div>
        )}

        {/* Sessions List */}
        {!sessionsLoading && !sessionsError && sessions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      Device Session
                    </span>
                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {sess.id.slice(0, 12)}...
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    Authorized: {new Date(sess.createdAt).toLocaleString()}
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRevokeSession(sess.id)}
                  disabled={sessionActionId === sess.id}
                >
                  {sessionActionId === sess.id ? (
                    <div className="spinner" style={{ width: "12px", height: "12px" }} />
                  ) : (
                    "Revoke"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Account */}
      <div
        className="dashboard-card"
        style={{
          padding: "1.5rem",
          background: "var(--bg-surface)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--accent-rose)", marginBottom: "0.25rem" }}>
              ⚠️ Danger Zone — Delete Account
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", maxWidth: "560px" }}>
              Permanently delete your SecurePass identity, revoke all sessions, and purge all encrypted security data. This operation cannot be undone.
            </p>
          </div>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            Permanently Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal Confirmation Flow */}
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
          <div
            style={{
              padding: "0.75rem",
              background: "var(--accent-rose-subtle)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ color: "var(--accent-rose)", fontSize: "0.8125rem", fontWeight: 600 }}>
              ⚠️ Warning: Account deletion is permanent and immediate.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              All cryptographic sessions, user credentials, and security records will be permanently removed.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-delete-pwd">Current Master Password</label>
            <div className="form-input-wrapper">
              <input
                id="profile-delete-pwd"
                type={showDeletePassword ? "text" : "password"}
                className="form-input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                required
                autoFocus
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
              <label className="form-label" htmlFor="profile-delete-mfa">6-Digit Authenticator Code</label>
              <input
                id="profile-delete-mfa"
                type="text"
                className="form-input mono"
                placeholder="123456"
                maxLength={6}
                value={deleteMfaCode}
                onChange={(e) => setDeleteMfaCode(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em" }}
                required
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="submit"
              className="btn btn-danger btn-block"
              disabled={deleteLoading || !deletePassword}
            >
              {deleteLoading ? <div className="spinner" /> : "Permanently Delete My Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke All Sessions Confirmation Modal */}
      <ConfirmModal
        isOpen={revokeAllModalOpen}
        onClose={() => setRevokeAllModalOpen(false)}
        onConfirm={handleRevokeAllSessions}
        title="Revoke All Other Sessions"
        message="Are you sure you want to revoke all other active sessions? All other logged-in devices will be signed out immediately."
        confirmText="Revoke All Devices"
        confirmVariant="danger"
        loading={revokeAllLoading}
      />
    </div>
  );
}
