import React from "react";
import styles from "@/styles/Toast.module.css";

interface ToastProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className={styles.toastOverlay}>
      <div className={styles.toastContent}>
        <p>{message}</p>
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={onConfirm}>
            예
          </button>
          <button className={styles.button} onClick={onCancel}>
            아니오
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
