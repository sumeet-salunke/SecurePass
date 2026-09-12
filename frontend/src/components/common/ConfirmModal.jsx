import Modal from "./Modal.jsx";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="420px"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-${confirmVariant} btn-sm`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{message}</p>
    </Modal>
  );
}
