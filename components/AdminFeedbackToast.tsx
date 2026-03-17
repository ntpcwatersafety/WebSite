import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface AdminFeedbackToastProps {
  messages: Array<{
    id: number;
    type: 'success' | 'error';
    text: string;
  }>;
  onDismiss: (id: number) => void;
}

const AdminFeedbackToast: React.FC<AdminFeedbackToastProps> = ({ messages, onDismiss }) => {
  if (!messages.length) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex w-[min(92vw,26rem)] flex-col gap-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`overflow-hidden rounded-2xl border shadow-xl backdrop-blur ${message.type === 'success' ? 'border-emerald-200 bg-emerald-600 text-white' : 'border-rose-200 bg-rose-600 text-white'}`}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5">
              {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-6">{message.text}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(message.id)}
              className="rounded-full p-1 text-white/85 transition hover:bg-white/15 hover:text-white"
              aria-label="關閉通知"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1 w-full bg-white/15">
            <div className="h-full w-full bg-white/45" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminFeedbackToast;