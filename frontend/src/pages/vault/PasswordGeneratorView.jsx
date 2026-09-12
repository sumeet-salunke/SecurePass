import { useState, useEffect, useCallback } from "react";
import { generatePassword, calculatePasswordStrength } from "../../utils/crypto.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function PasswordGeneratorView({ isModal = false, onClose }) {
  const toast = useToast();

  const [length, setLength] = useState(18);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const handleGenerate = useCallback(() => {
    const generated = generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
    });
    setPassword(generated);
  }, [length, uppercase, lowercase, numbers, symbols]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const strength = calculatePasswordStrength(password);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast.success("Generated password copied to clipboard!");
  };

  return (
    <div className={isModal ? "" : "page-wrapper animate-fade-in"}>
      {!isModal && (
        <div className="section-header">
          <div>
            <h1 className="section-title">Password Generator</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Generate cryptographically strong, uncrackable passwords
            </p>
          </div>
        </div>
      )}

      <div
        className="auth-card"
        style={{
          maxWidth: isModal ? "100%" : "540px",
          margin: isModal ? 0 : "0 auto",
          padding: isModal ? "0.5rem 0" : "2rem",
          background: isModal ? "transparent" : "var(--bg-surface)",
          border: isModal ? "none" : "1px solid var(--border-subtle)",
          boxShadow: isModal ? "none" : "var(--shadow-lg)",
        }}
      >
        {/* Output Box */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: length > 30 ? "0.9375rem" : "1.25rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {password}
          </span>

          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, marginLeft: "0.75rem" }}>
            <button className="icon-btn" onClick={handleGenerate} title="Regenerate password">
              🔄
            </button>
            <button className="icon-btn" onClick={handleCopy} title="Copy password">
              📋
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.375rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Strength Rating</span>
            <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
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

        {/* Length Slider */}
        <div className="form-group">
          <div className="form-label">
            <label>Password Length</label>
            <span className="mono" style={{ color: "var(--accent-cyan)", fontWeight: 700, fontSize: "1rem" }}>
              {length}
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-cyan)", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            <span>8 chars (Min)</span>
            <span>32 chars (Optimal)</span>
            <span>64 chars</span>
          </div>
        </div>

        {/* Character Set Toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", margin: "1.5rem 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
            />
            Uppercase (A-Z)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
            />
            Lowercase (a-z)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
            />
            Numbers (0-9)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
            />
            Symbols (!@#$...)
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button className="btn btn-primary btn-block" onClick={handleCopy}>
            📋 Copy Password
          </button>
          {isModal && (
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
