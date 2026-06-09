import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { GalleryItem, ActivityRegistrationFormData } from '../types';
import { submitActivityRegistration, validateActivityRegistration } from '../services/activityRegistration';

interface ActivityRegistrationDialogProps {
  activity: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
}

const buildInitialForm = (activity: GalleryItem): ActivityRegistrationFormData => ({
  activityId: activity.id,
  activityTitle: activity.title,
  name: '',
  email: '',
  gender: 'male',
  birthDate: '',
  identity: 'member',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  referralSource: 'member',
  referralSourceOther: '',
  notes: '',
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

    const validationMessage = validateActivityRegistration(formData);
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
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">姓名</span>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="請輸入姓名"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="example@email.com"
                />
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">性別</legend>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'male'}
                    onChange={() => updateField('gender', 'male')}
                  />
                  生理男
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'female'}
                    onChange={() => updateField('gender', 'female')}
                  />
                  生理女
                </label>
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">出生日期（民國）</span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.birthDate}
                  onChange={(event) => updateField('birthDate', event.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="例如：701123"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">手機號碼</span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="例如：0939123789"
                />
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">身分別</legend>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="identity" checked={formData.identity === 'member'} onChange={() => updateField('identity', 'member')} />有效會員
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="identity" checked={formData.identity === 'memberFamily'} onChange={() => updateField('identity', 'memberFamily')} />會員回娘家
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="identity" checked={formData.identity === 'newMember'} onChange={() => updateField('identity', 'newMember')} />新入會(欲加入會員)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="identity" checked={formData.identity === 'nonMember'} onChange={() => updateField('identity', 'nonMember')} />非會員
                </label>
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">緊急聯絡人姓名</span>
                <input
                  required
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(event) => updateField('emergencyContactName', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">緊急聯絡人手機</span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.emergencyContactPhone}
                  onChange={(event) => updateField('emergencyContactPhone', event.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="僅用於緊急聯絡"
                />
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">請問您如何得知本活動</legend>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'member'} onChange={() => updateField('referralSource', 'member')} />本身是會員</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'friend'} onChange={() => updateField('referralSource', 'friend')} />朋友介紹</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'flyer'} onChange={() => updateField('referralSource', 'flyer')} />臉書看到</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'officialSite'} onChange={() => updateField('referralSource', 'officialSite')} />本會官網看到</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'beclass'} onChange={() => updateField('referralSource', 'beclass')} />BeClass網站看到</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="referral" checked={formData.referralSource === 'other'} onChange={() => updateField('referralSource', 'other')} />其他</label>
              </div>

              {formData.referralSource === 'other' ? (
                <input
                  type="text"
                  value={formData.referralSourceOther || ''}
                  onChange={(event) => updateField('referralSourceOther', event.target.value)}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="請填寫來源"
                />
              ) : null}
            </fieldset>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">備註（選填）</span>
              <textarea
                rows={4}
                value={formData.notes || ''}
                onChange={(event) => updateField('notes', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="其他想告知承辦人員的資訊"
              />
            </label>

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
