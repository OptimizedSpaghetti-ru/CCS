import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface ToastData {
  id: string;
  type: 'message' | 'announcement' | 'event' | 'error';
  title: string;
  preview: string;
  time: string;
}

interface AppContextType {
  unreadMessages: number;
  unreadNotifications: number;
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  dismissToast: (id: string) => void;
  currentUser: {
    name: string;
    role: 'student' | 'faculty';
    id: string;
    department: string;
    yearSection: string;
    email: string;
    avatar: string;
    initials: string;
  };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      unreadMessages: 3,
      unreadNotifications: 5,
      toasts,
      showToast,
      dismissToast,
      currentUser: {
        name: 'Juan dela Cruz',
        role: 'student',
        id: '2021-10432',
        department: 'College of Computer Studies',
        yearSection: '3rd Year – BSCS 3-A',
        email: 'juan.delacruz@student.fatima.edu.ph',
        avatar: '',
        initials: 'JC',
      },
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}