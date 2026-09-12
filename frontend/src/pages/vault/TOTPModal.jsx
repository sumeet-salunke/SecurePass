import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";

export default function TOTPModal({ isOpen, onClose, onSave, initialData = null, loading = false }) {
  const [serviceName, setServiceName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA1");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (initialData) {
      setServiceName(initialData.serviceName || "");
      setAccountName(initialData.accountName || "");
      setSecretKey(initialData.secretKey || "");
      setAlgorithm(initialData.algorithm || "SHA1");
      setDigits(initialData.digits || 6);
      setPeriod(initialData.period || 30);
    } else {
      setServiceName("");
      setAccountName("");
      setSecretKey("");
      setAlgorithm("SHA1");
      setDigits(6);
      setPeriod(30);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!serviceName.trim() || !secretKey.trim()) return;

    onSave({
      serviceName: serviceName.trim(),
      accountName: accountName.trim(),
      secretKey: secretKey.trim().replace(/\s+/g, ""),
      algorithm,
      digits: Number(digits),
      period: Number(period),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit 2FA Authenticator" : "Add 2FA Authenticator"}
      maxWidth="540px"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={loading || !serviceName.trim() || !secretKey.trim()}
          >
            {loading ? "Encrypting & Saving..." : initialData ? "Save Changes" : "Add Authenticator"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Service / Issuer Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. GitHub, AWS, Google, Discord"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account / Email</label>
          <input
            type="text"
            className="form-input"
            placeholder="user@example.com"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Base32 Secret Key *</label>
          <input
            type="text"
            className="form-input mono"
            placeholder="JBSWY3DPEHPK3PXP"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
            required
          />
          <p className="form-help-text">Paste the setup key provided by the 2FA configuration screen.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Algorithm</label>
            <select
              className="form-input"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="SHA1">SHA1</option>
              <option value="SHA256">SHA256</option>
              <option value="SHA512">SHA512</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Digits</label>
            <select
              className="form-input"
              value={digits}
              onChange={(e) => setDigits(Number(e.target.value))}
            >
              <option value={6}>6 Digits</option>
              <option value={8}>8 Digits</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Period (Sec)</label>
            <input
              type="number"
              className="form-input"
              min={15}
              max={120}
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
