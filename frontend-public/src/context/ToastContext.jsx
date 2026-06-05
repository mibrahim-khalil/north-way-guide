import { createContext, useContext, useRef, useState } from "react";
import Toast from "../components/common/Toast";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [state, setState] = useState({ show: false, message: "" });
  const timerRef = useRef(null);

  const toast = (message, duration = 2000) => {
    setState({ show: true, message });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setState({ show: false, message: "" });
    }, duration);
  };

  const close = () => setState({ show: false, message: "" });

  return (
    <ToastCtx.Provider value={{ toast, close }}>
      {children}
      <Toast show={state.show} message={state.message} onClose={close} />
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);