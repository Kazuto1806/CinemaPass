import {
  useCallback,
  useRef,
  useState,
} from "react";
import NotificationPopup from "./NotificationPopup";
import { NotificationContext } from "./NotificationContext";

const DEFAULT_TITLES = {
  success: "Thành công",
  error: "Có lỗi xảy ra",
  warning: "Thông báo",
};

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const activeNotification = useRef(null);
  const notificationQueue = useRef([]);

  const enqueue = useCallback((item) => {
    if (activeNotification.current) {
      notificationQueue.current.push(item);
      return;
    }

    activeNotification.current = item;
    setNotification(item);
  }, []);

  const notify = useCallback(
    (message, type = "error", title) => {
      enqueue({
        type,
        title: title || DEFAULT_TITLES[type] || DEFAULT_TITLES.warning,
        message: String(message),
      });
    },
    [enqueue]
  );

  const confirm = useCallback(
    (message, options = {}) =>
      new Promise((resolve) => {
        enqueue({
          type: options.type || "warning",
          title: options.title || "Xác nhận",
          message: String(message),
          confirmLabel: options.confirmLabel || "Xác nhận",
          cancelLabel: options.cancelLabel || "Hủy",
          resolve,
        });
      }),
    [enqueue]
  );

  const finishNotification = useCallback((result) => {
    const current = activeNotification.current;
    if (!current) return;

    current.resolve?.(result);

    const next = notificationQueue.current.shift() || null;
    activeNotification.current = next;
    setNotification(next);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      {notification && (
        <NotificationPopup
          show
          type={notification.type}
          title={notification.title}
          message={notification.message}
          confirmLabel={notification.confirmLabel}
          cancelLabel={notification.cancelLabel}
          onClose={() => finishNotification(false)}
          onConfirm={
            notification.resolve
              ? () => finishNotification(true)
              : undefined
          }
        />
      )}
    </NotificationContext.Provider>
  );
}
