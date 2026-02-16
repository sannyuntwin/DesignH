'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
    id: string
    message: string
    type?: 'success' | 'error' | 'info'
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-right-10 duration-300 flex items-center gap-3 ${toast.type === 'success'
                                ? 'bg-green-500/90 border-green-400 text-white'
                                : toast.type === 'error'
                                    ? 'bg-red-500/90 border-red-400 text-white'
                                    : 'bg-blue-600/90 border-blue-400 text-white'
                            }`}
                    >
                        <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
