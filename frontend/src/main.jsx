import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { VaultProvider } from "./context/VaultContext.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ToastProvider>
      <VaultProvider>
        <App />
      </VaultProvider>
    </ToastProvider>
  </AuthProvider>
);

