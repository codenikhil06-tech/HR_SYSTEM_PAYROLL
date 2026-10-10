import React from 'react';
import { useHR } from '../store';

export default function ToastContainer() {
  const { toasts } = useHR();

  return (
    <div id="toast-root">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
