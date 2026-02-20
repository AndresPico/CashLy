import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const FeedbackContext = createContext(null);

const DEFAULT_CONFIRM = {
  title: 'Confirmar accion',
  message: 'Esta accion no se puede deshacer.',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'danger'
};

const makeToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function Icon({ type }) {
  if (type === 'success') {
    return (
      <svg viewBox="0 0 24 24" className="feedback-icon-svg" aria-hidden="true">
        <path d="M9.3 16.4 5.6 12.7l-1.4 1.4 5.1 5.1L20 8.5l-1.4-1.4z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="feedback-icon-svg" aria-hidden="true">
      <path
        d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
        fill="currentColor"
      />
    </svg>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="feedback-toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`feedback-toast ${toast.type}`}>
          <div className={`feedback-icon ${toast.type}`}>
            <Icon type={toast.type} />
          </div>
          <div className="feedback-toast-content">
            {toast.title ? <strong>{toast.title}</strong> : null}
            <p>{toast.message}</p>
          </div>
          <button
            type="button"
            className="feedback-toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Cerrar notificacion"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ options, onCancel, onConfirm }) {
  if (!options) return null;

  return (
    <div className="feedback-confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="feedback-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-confirm-title"
        aria-describedby="feedback-confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`feedback-icon ${options.variant === 'danger' ? 'error' : 'success'}`}>
          <Icon type={options.variant === 'danger' ? 'error' : 'success'} />
        </div>
        <h3 id="feedback-confirm-title">{options.title}</h3>
        <p id="feedback-confirm-message">{options.message}</p>
        {options.note ? <small>{options.note}</small> : null}
        <div className="feedback-confirm-actions">
          <button type="button" className="feedback-btn secondary" onClick={onCancel}>
            {options.cancelText}
          </button>
          <button
            type="button"
            className={`feedback-btn ${options.variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {options.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmOptions, setConfirmOptions] = useState(null);
  const confirmResolver = useRef(null);
  const timeoutIds = useRef(new Map());

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    const timeoutId = timeoutIds.current.get(toastId);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIds.current.delete(toastId);
    }
  }, []);

  const notify = useCallback(
    ({ type = 'success', title = '', message, duration = 3800 }) => {
      if (!message) return;

      const id = makeToastId();
      setToasts((prev) => [...prev, { id, type, title, message }]);

      const timeoutId = setTimeout(() => {
        dismissToast(id);
      }, duration);

      timeoutIds.current.set(id, timeoutId);
    },
    [dismissToast]
  );

  const success = useCallback(
    (message, title = 'Operacion completada') => {
      notify({ type: 'success', title, message });
    },
    [notify]
  );

  const error = useCallback(
    (message, title = 'Operacion fallida') => {
      notify({ type: 'error', title, message, duration: 4500 });
    },
    [notify]
  );

  const resolveConfirm = useCallback((value) => {
    if (confirmResolver.current) {
      confirmResolver.current(value);
      confirmResolver.current = null;
    }
    setConfirmOptions(null);
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        if (confirmResolver.current) {
          confirmResolver.current(false);
        }

        confirmResolver.current = resolve;
        setConfirmOptions({ ...DEFAULT_CONFIRM, ...options });
      }),
    []
  );

  useEffect(() => {
    if (!confirmOptions) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        resolveConfirm(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [confirmOptions, resolveConfirm]);

  useEffect(
    () => () => {
      timeoutIds.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutIds.current.clear();
    },
    []
  );

  const value = useMemo(
    () => ({
      notify,
      success,
      error,
      confirm
    }),
    [notify, success, error, confirm]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        options={confirmOptions}
        onCancel={() => resolveConfirm(false)}
        onConfirm={() => resolveConfirm(true)}
      />
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }

  return context;
}
