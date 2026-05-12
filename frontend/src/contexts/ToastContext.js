/**
 * ToastContext — 전역 토스트 알림 상태 관리
 *
 * useToast() 훅을 통해 앱 어디서든 토스트를 호출할 수 있다.
 * showToast({ message, type, duration }) 메서드 제공.
 * 최대 3개 스택, 오래된 것 자동 제거.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const ToastContext = createContext(null);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;
const MIN_DURATION = 2000;

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = DEFAULT_DURATION }) => {
    const safeDuration = Math.max(duration, MIN_DURATION);
    const id = ++toastIdCounter;

    const newToast = { id, message, type, duration: safeDuration, createdAt: Date.now() };

    setToasts((prev) => {
      const next = [...prev, newToast];
      if (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (removed && timersRef.current[removed.id]) {
          clearTimeout(timersRef.current[removed.id]);
          delete timersRef.current[removed.id];
        }
      }
      return next;
    });

    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, safeDuration);

    return id;
  }, [removeToast]);

  const contextValue = useMemo(
    () => ({ toasts, showToast, removeToast }),
    [toasts, showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
