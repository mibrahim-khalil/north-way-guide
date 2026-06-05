import "./Toast.css";

export default function Toast({ show, message, onClose }) {
  if (!show) return null;

  return (
    <div className="toastWrap" role="status" aria-live="polite">
      <div className="toastCard">
        <div className="toastMsg">{message}</div>
        <button className="toastClose" onClick={onClose} aria-label="Close toast">
          ✕
        </button>
      </div>
    </div>
  );
}