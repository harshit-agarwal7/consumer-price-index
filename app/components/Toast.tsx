'use client';

import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer = ({ toasts }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg px-4 py-3 shadow-2xl animate-in slide-in-from-bottom duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-slate-200">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
