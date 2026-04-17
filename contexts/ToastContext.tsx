import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface ToastContextValue {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  messages: ToastMessage[];
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    if (type === 'info') return;
    const id = Date.now();
    setMessages(prev => [...prev, { id, type, text: message }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, messages, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
