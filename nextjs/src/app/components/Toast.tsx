import React from "react";
import styles from "@/styles/Toast.module.css";

interface ToastProps {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // onCancel은 선택적
  confirmText?: string; // 확인 버튼 텍스트
  cancelText?: string; // 취소 버튼 텍스트
}

const Toast: React.FC<ToastProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = "예",
  cancelText = "아니오",
}) => {
  return (
    <div className={styles.toastOverlay}>
      <div className={styles.toastContent}>
        <p>{message}</p>
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={onConfirm}>
            {confirmText}
          </button>
          {onCancel && (
            <button className={styles.button} onClick={onCancel}>
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
