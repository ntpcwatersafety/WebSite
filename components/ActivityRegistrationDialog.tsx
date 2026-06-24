import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { GalleryItem, ActivityRegistrationFormData } from '../types';
import {
  buildActivityRegistrationInitialForm,
  submitActivityRegistration,
  validateActivityRegistration,
} from '../services/activityRegistration';
import ActivityRegistrationFormFields from './ActivityRegistrationFormFields';

interface ActivityRegistrationDialogProps {
  activity: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
}

const buildInitialForm = (activity: GalleryItem): ActivityRegistrationFormData => ({
  ...buildActivityRegistrationInitialForm(activity.id, activity.title),
});

const ActivityRegistrationDialog: React.FC<ActivityRegistrationDialogProps> = ({ activity, isOpen, onClose }) => {
  const [formData, setFormData] = useState<ActivityRegistrationFormData>(() => buildInitialForm(activity));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setFormData(buildInitialForm(activity));
    setStatus('idle');
    setErrorMessage('');
  }, [activity.id, isOpen]);

  const updateField = <K extends keyof ActivityRegistrationFormData>(field: K, value: ActivityRegistrationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateActivityRegistration(formData, activity.periodOptions || []);
    if (validationMessage) {
      setStatus('error');
      setErrorMessage(validationMessage);
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await submitActivityRegistration(formData);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('送出失敗，請稍後再試，或改用外部報名連結。');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/60 px-4 py-6" onClick={onClose} role="dialog" aria-modal="true" aria-label="活動報名表單">
      <div
        className="mx-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">線上報名</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{activity.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="關閉報名表單"
          >
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-10 text-center">
            <h4 className="text-2xl font-bold text-green-700">報名送出成功</h4>
            <p className="mt-3 text-slate-600">我們已收到您的報名資料，後續將由承辦人員與您聯繫。</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-500"
            >
              關閉
            </button>
          </div>
        ) : (
          <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
            <ActivityRegistrationFormFields
              formData={formData}
              onChange={updateField}
              periodOptions={activity.periodOptions || []}
              namePrefix={`front-${activity.id}`}
            />

            {status === 'error' && errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-xs leading-5 text-slate-500">送出後將由承辦人員人工確認報名資料。</p>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white transition ${
                  status === 'submitting'
                    ? 'cursor-not-allowed bg-slate-400'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                <Send size={16} />
                {status === 'submitting' ? '送出中...' : '送出報名'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ActivityRegistrationDialog;
