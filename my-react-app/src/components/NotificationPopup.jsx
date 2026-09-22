import React from "react";
import "./NotificationPopup.css";

const NotificationPopup = ({
  show,
  type = "success",
  title,
  message,
  onClose,
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

        <button
          className="notification-close"
          onClick={onClose}
        >
          OK
        </button>

      </div>
    </div>
  );
};

export default NotificationPopup;