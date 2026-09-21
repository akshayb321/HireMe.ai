import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  title = "Are you sure?",
  message = "Do you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div
        className="confirm-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-modal-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <div className="confirm-modal-content">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="confirm-modal-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
