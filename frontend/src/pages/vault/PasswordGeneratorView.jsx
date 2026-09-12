import { useState, useEffect, useCallback } from "react";
import { generatePassword, calculatePasswordStrength } from "../../utils/crypto.js";
import { useToast } from "../../context/ToastContext.jsx";

const PRESET_LENGTHS = [
  { label: "Basic", value: 12 },
  { label: "Standard", value: 16 },
  { label: "Strong", value: 24 },
  { label: "Maximum", value: 32 },
];

export default function PasswordGeneratorView({ isModal = false, onClose }) {
  const toast = useToast();

  const [length, setLength] = useState(18);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(() => {
    // Ensure at least one character set is selected
    if (!uppercase && !lowercase && !numbers && !symbols) {
      setError("At least one character set must be selected.");
      return;
    }
    setError(null);

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

  // Clean memory on unmount
  useEffect(() => {
    return () => {
      setPassword("");
    };
  }, []);

  const strength = calculatePasswordStrength(password);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast.success("Generated password copied to clipboard!");
  };

  const handleToggleOption = (setter, currentValue, otherValues) => {
    // Check if turning this off would leave 0 active sets
    const remainingActive = otherValues.filter(Boolean).length;
    if (currentValue && remainingActive === 0) {
      setError("At least one character set must remain selected.");
      return;
    }
    setError(null);
    setter(!currentValue);
  };

  const handleSetPreset = (presetValue) => {
    setLength(presetValue);
  };

  return (
    <div className={isModal ? "" : "page-wrapper animate-fade-in"}>
      {!isModal && (
        <div className="section-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h1 className="section-title">Password Generator</h1>
              <span
                className="nav-badge"
                style={{
                  color: "var(--accent-cyan)",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                }}
              >
                CSPRNG Active ⚡
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Cryptographically secure pseudo-random password generation using browser WebCrypto CSPRNG
            </p>
          </div>
        </div>
      )}

      <div
        className="auth-card"
        style={{
          maxWidth: isModal ? "100%" : "560px",
          margin: isModal ? 0 : "0 auto",
          padding: isModal ? "0.5rem 0" : "2rem",
          background: isModal ? "transparent" : "var(--bg-surface)",
          border: isModal ? "none" : "1px solid var(--border-subtle)",
          boxShadow: isModal ? "none" : "var(--shadow-lg)",
        }}
      >
        {/* Error Feedback */}
        {error && (
          <div
            className="toast-card toast-error animate-fade-in"
            style={{ marginBottom: "1rem", width: "100%", padding: "0.6rem 0.85rem" }}
            role="alert"
          >
            <div className="toast-icon" style={{ fontSize: "0.85rem" }}>✕</div>
            <div className="toast-content">
              <p className="toast-message" style={{ fontSize: "0.8125rem" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Generated Password Output Box */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            minHeight: "64px",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden", marginRight: "0.75rem" }}>
            <span
              className="mono"
              style={{
                fontSize: length > 36 ? "0.875rem" : length > 24 ? "1.05rem" : "1.25rem",
                fontWeight: 600,
                color: showPassword ? "var(--text-primary)" : "var(--text-muted)",
                letterSpacing: showPassword ? "0.02em" : "0.15em",
                wordBreak: "break-all",
                userSelect: showPassword ? "all" : "none",
                display: "block",
              }}
            >
              {showPassword ? password : "••••••••••••••••••••"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <button
              className="icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Mask password" : "Show password"}
              aria-label={showPassword ? "Mask password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
            <button
              className="icon-btn"
              onClick={handleGenerate}
              title="Regenerate new random password"
              aria-label="Regenerate password"
            >
              🔄
            </button>
            <button
              className="icon-btn"
              onClick={handleCopy}
              title="Copy password to clipboard"
              aria-label="Copy password to clipboard"
            >
              📋
            </button>
          </div>
        </div>

        {/* Password Strength Meter */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.375rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Calculated Entropy & Strength</span>
            <span style={{ color: strength.color, fontWeight: 700 }}>
              {strength.label} ({strength.score}/100)
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${strength.score}%`,
                background: strength.color,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Length Slider & Preset Controls */}
        <div className="form-group" style={{ marginBottom: "1.25rem" }}>
          <div className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="password-length-slider" style={{ marginBottom: 0 }}>
              Password Length
            </label>
            <span className="mono" style={{ color: "var(--accent-cyan)", fontWeight: 700, fontSize: "1.125rem" }}>
              {length} characters
            </span>
          </div>
          <input
            id="password-length-slider"
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-cyan)", cursor: "pointer", marginTop: "0.35rem" }}
            aria-label="Password length slider"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            <span>8 (Min)</span>
            <span>24 (Recommended)</span>
            <span>64 (Max)</span>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {PRESET_LENGTHS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`btn-filter ${length === preset.value ? "active" : ""}`}
                onClick={() => handleSetPreset(preset.value)}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              >
                {preset.value} chars ({preset.label})
              </button>
            ))}
          </div>
        </div>

        {/* Character Set Toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", margin: "1.25rem 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={uppercase}
              onChange={() => handleToggleOption(setUppercase, uppercase, [lowercase, numbers, symbols])}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            Uppercase (A-Z)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={lowercase}
              onChange={() => handleToggleOption(setLowercase, lowercase, [uppercase, numbers, symbols])}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            Lowercase (a-z)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={numbers}
              onChange={() => handleToggleOption(setNumbers, numbers, [uppercase, lowercase, symbols])}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            Numbers (0-9)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={symbols}
              onChange={() => handleToggleOption(setSymbols, symbols, [uppercase, lowercase, numbers])}
              style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            Symbols (!@#$...)
          </label>
        </div>

        {/* Actions Toolbar */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            className="btn btn-primary btn-block"
            onClick={handleCopy}
            aria-label="Copy generated password"
          >
            📋 Copy Password
          </button>
          {isModal && (
            <button className="btn btn-secondary" onClick={onClose} aria-label="Close generator modal">
              Close
            </button>
          )}
        </div>

        {/* Security Notice */}
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1rem" }}>
          🔒 Generated in volatile memory with zero server transmission, logs, or persistent browser storage.
        </p>
      </div>
    </div>
  );
}
