import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import DashboardView from "../../pages/dashboard/DashboardView.jsx";
import SettingsView from "../../pages/settings/SettingsView.jsx";

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Navbar onToggleMobileNav={() => setMobileOpen(!mobileOpen)} />

        {activeTab === "dashboard" ? (
          <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />
        ) : (
          <SettingsView initialSubTab={activeTab} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
      </div>
    </div>
  );
}
