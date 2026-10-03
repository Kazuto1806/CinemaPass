import React from "react";
import "./NotificationPopup.css";

const NotificationPopup = ({
  show,
  type = "success",
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
}) => {
  if (!show) return null;

  return (
    <div className="notification-overlay">
      <div className={`notification-popup ${type}`}>
        
        <div className="notification-icon">
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "warning" && "!"}
        </div>

        <h3>{title}</h3>

        <p>{message}</p>

        {onConfirm ? (
          <div className="notification-actions">
            <button
              className="notification-cancel"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              className="notification-confirm"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button
            className="notification-close"
            onClick={onClose}
          >
            OK
          </button>
        )}

      </div>
    </div>
  );
};

export default NotificationPopup;