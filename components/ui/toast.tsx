'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 left-5 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-2',
              t.type === 'success' && 'bg-white text-green-800 border-green-200',
              t.type === 'warning' && 'bg-white text-amber-800 border-amber-200',
              t.type === 'error' && 'bg-white text-red-800 border-red-200'
            )}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
