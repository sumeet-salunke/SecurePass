import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, "success", duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, "error", duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, "info", duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, "warning", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast container overlay */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type} animate-slide-in`}>
            <div className="toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✕"}
              {toast.type === "warning" && "!"}
              {toast.type === "info" && "ℹ"}
            </div>
            <div className="toast-content">
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
