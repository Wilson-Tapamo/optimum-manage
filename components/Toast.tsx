'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { AuthProvider } from '@/providers/AuthProvider';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            removeToast(id);
        }, toast.duration || 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-white border-l-4 border-green-500 shadow-lg';
            case 'error':
                return 'bg-white border-l-4 border-red-500 shadow-lg';
            case 'warning':
                return 'bg-white border-l-4 border-yellow-500 shadow-lg';
            case 'info':
                return 'bg-white border-l-4 border-blue-500 shadow-lg';
        }
    };

    return (
        <AuthProvider>
            <ToastContext.Provider value={{ addToast, removeToast }}>
                {children}

                {/* Toast Container */}
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`min-w-80 max-w-md p-4 rounded-lg ${getToastStyles(toast.type)} transform transition-all duration-300 ease-in-out`}
                            style={{
                                animation: 'slideInRight 0.3s ease-out'
                            }}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {getToastIcon(toast.type)}
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="font-medium text-gray-900">{toast.title}</p>
                                    {toast.message && (
                                        <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="flex-shrink-0 ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </ToastContext.Provider>
        </AuthProvider>
    );
};