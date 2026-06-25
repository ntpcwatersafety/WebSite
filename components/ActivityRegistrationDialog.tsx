import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Send, LogIn, UserPlus, UserCheck } from 'lucide-react';
import { GalleryItem, ActivityRegistrationFormData, MemberIdentity, RegistrationIdentity } from '../types';
import {
  buildActivityRegistrationInitialForm,
  submitActivityRegistration,
  validateActivityRegistration,
} from '../services/activityRegistration';
import { getMemberSession, getMemberProfile } from '../services/memberService';
import ActivityRegistrationFormFields from './ActivityRegistrationFormFields';

interface ActivityRegistrationDialogProps {
  activity: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
}

const memberIdentityToRegistration = (id: MemberIdentity): RegistrationIdentity => {
  if (id === 'new') return 'newMember';
  return 'member';
};

const buildInitialForm = (activity: GalleryItem): ActivityRegistrationFormData => ({
  ...buildActivityRegistrationInitialForm(activity.id, activity.title),
});

const ActivityRegistrationDialog: React.FC<ActivityRegistrationDialogProps> = ({ activity, isOpen, onClose }) => {
  const [formData, setFormData] = useState<ActivityRegistrationFormData>(() => buildInitialForm(activity));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setStatus('idle');
    setErrorMessage('');
    setAutoFilled(false);

    const session = getMemberSession();
    if (!session) {
      setFormData(buildInitialForm(activity));
      return;
    }

    getMemberProfile(session.email).then(profile => {
      if (!profile) {
        setFormData(buildInitialForm(activity));
        return;
      }
      setFormData({
        ...buildInitialForm(activity),
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        birthDate: profile.birthDate,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone,
        identity: memberIdentityToRegistration(profile.identity),
        referralSource: 'member',
      });
      setAutoFilled(true);
    });
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

  const isLoggedIn = !!getMemberSession();

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

            {/* 登入提示橫幅 */}
            {isLoggedIn ? (
              autoFilled ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <UserCheck size={18} className="shrink-0 text-green-600" />
                  <span>已自動帶入您的會員基本資料，請確認後送出。</span>
                </div>
              ) : null
            ) : (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                <p className="text-sm font-medium text-cyan-900">
                  登入會員後，可自動帶入姓名、電話、生日、緊急聯絡人等基本資料，不需重複填寫。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/member/login"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <LogIn size={15} />
                    會員登入
                  </Link>
                  <Link
                    to="/member/register"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                  >
                    <UserPlus size={15} />
                    註冊會員
                  </Link>
                </div>
              </div>
            )}

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
