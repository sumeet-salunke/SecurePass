import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import DashboardView from "../../pages/dashboard/DashboardView.jsx";
import AccountProfileView from "../../pages/account/AccountProfileView.jsx";
import SettingsView from "../../pages/settings/SettingsView.jsx";
import { useVault } from "../../context/VaultContext.jsx";
import VaultUnlockOverlay from "../../pages/vault/VaultUnlockOverlay.jsx";
import Dashboard from "../../pages/vault/Dashboard.jsx";
import CredentialsView from "../../pages/vault/CredentialsView.jsx";
import SecureNotesView from "../../pages/vault/SecureNotesView.jsx";
import TOTPView from "../../pages/vault/TOTPView.jsx";
import PasswordGeneratorView from "../../pages/vault/PasswordGeneratorView.jsx";
import CredentialModal from "../../pages/vault/CredentialModal.jsx";
import SecureNoteModal from "../../pages/vault/SecureNoteModal.jsx";
import TOTPModal from "../../pages/vault/TOTPModal.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    hasVault,
    isUnlocked,
    vaultLoading,
    vaultError,
    checkVaultStatus,
    addCredential,
    addNote,
    addTOTP,
  } = useVault();
  const toast = useToast();

  // Quick modals state from Dashboard quick actions
  const [quickCredModal, setQuickCredModal] = useState(false);
  const [quickNoteModal, setQuickNoteModal] = useState(false);
  const [quickTotpModal, setQuickTotpModal] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const handleQuickAddCred = async (data) => {
    try {
      setModalSaving(true);
      await addCredential(data);
      toast.success("Credential encrypted & saved to vault!");
      setQuickCredModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to save credential.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleQuickAddNote = async (data) => {
    try {
      setModalSaving(true);
      await addNote(data);
      toast.success("Secure note encrypted & saved!");
      setQuickNoteModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to save note.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleQuickAddTotp = async (data) => {
    try {
      setModalSaving(true);
      await addTOTP(data);
      toast.success("2FA Authenticator added!");
      setQuickTotpModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to save authenticator.");
    } finally {
      setModalSaving(false);
    }
  };

  const isVaultTab = activeTab.startsWith("vault");

  const renderContent = () => {
    if (activeTab === "dashboard") {
      return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
    if (activeTab === "account") {
      return <AccountProfileView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
    if (["password", "email", "security", "sessions", "danger"].includes(activeTab)) {
      return <SettingsView initialSubTab={activeTab} onNavigateTab={(tab) => setActiveTab(tab)} />;
    }

    // Vault Views
    if (isVaultTab) {
      if (vaultLoading) {
        return (
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Verifying cryptographic vault status...
            </p>
          </div>
        );
      }

      if (vaultError && hasVault === null) {
        return (
          <div
            className="page-wrapper animate-fade-in"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              gap: "1.25rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              ⚠️
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Unable to Load Vault Status
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {vaultError}
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={checkVaultStatus}>
              🔄 Retry Connection
            </button>
          </div>
        );
      }

      if (!isUnlocked) {
        return <VaultUnlockOverlay />;
      }

      switch (activeTab) {
        case "vault":
        case "vault-dashboard":
          return (
            <Dashboard
              onNavigateTab={(tab) => {
                if (tab === "credentials") setActiveTab("vault-credentials");
                else if (tab === "notes") setActiveTab("vault-notes");
                else if (tab === "totp") setActiveTab("vault-totp");
                else setActiveTab(tab);
              }}
              onOpenNewCredential={() => setQuickCredModal(true)}
              onOpenNewNote={() => setQuickNoteModal(true)}
              onOpenNewTOTP={() => setQuickTotpModal(true)}
              onOpenGenerator={() => setActiveTab("vault-generator")}
            />
          );
        case "vault-credentials":
          return <CredentialsView />;
        case "vault-notes":
          return <SecureNotesView />;
        case "vault-totp":
          return <TOTPView />;
        case "vault-generator":
          return <PasswordGeneratorView />;
        default:
          return <Dashboard onNavigateTab={setActiveTab} />;
      }
    }

    return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
  };

  return (
    <div className="app-container">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Navbar
          onToggleMobileNav={() => setMobileOpen(!mobileOpen)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {renderContent()}
      </div>

      {/* Quick Add Modals */}
      <CredentialModal
        isOpen={quickCredModal}
        onClose={() => setQuickCredModal(false)}
        onSave={handleQuickAddCred}
        loading={modalSaving}
      />

      <SecureNoteModal
        isOpen={quickNoteModal}
        onClose={() => setQuickNoteModal(false)}
        onSave={handleQuickAddNote}
        loading={modalSaving}
      />

      <TOTPModal
        isOpen={quickTotpModal}
        onClose={() => setQuickTotpModal(false)}
        onSave={handleQuickAddTotp}
        loading={modalSaving}
      />
    </div>
  );
}

