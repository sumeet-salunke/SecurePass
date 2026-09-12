import { useAuth } from "./context/AuthContext.jsx";
import AuthContainer from "./pages/auth/AuthContainer.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-main)",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            background: "rgba(37, 99, 235, 0.15)",
            border: "1px solid rgba(37, 99, 235, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          🛡️
        </div>
        <div className="spinner" style={{ width: "28px", height: "28px", borderWidth: "3px" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>
          Restoring secure session...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <AppLayout /> : <AuthContainer />;
}

export default App;