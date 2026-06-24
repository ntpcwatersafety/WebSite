import React from 'react';
import { ActivityRegistrationFormData } from '../types';

export interface RegistrationActivityOption {
  id: string;
  title: string;
}

interface ActivityRegistrationFormFieldsProps {
  formData: ActivityRegistrationFormData;
  onChange: <K extends keyof ActivityRegistrationFormData>(field: K, value: ActivityRegistrationFormData[K]) => void;
  activityOptions?: RegistrationActivityOption[];
  periodOptions?: string[];
  showActivitySelect?: boolean;
  namePrefix?: string;
}

const ActivityRegistrationFormFields: React.FC<ActivityRegistrationFormFieldsProps> = ({
  formData,
  onChange,
  activityOptions = [],
  periodOptions = [],
  showActivitySelect = false,
  namePrefix = 'registration',
}) => {
  const updateField = <K extends keyof ActivityRegistrationFormData>(field: K, value: ActivityRegistrationFormData[K]) => {
    onChange(field, value);
  };

  const handleActivityChange = (activityId: string) => {
    const matched = activityOptions.find((item) => item.id === activityId);
    updateField('activityId', activityId);
    updateField('activityTitle', matched?.title || '');
  };

  const handleTogglePeriod = (period: string) => {
    const current = formData.selectedPeriods || [];
    const exists = current.includes(period);
    const next = exists ? current.filter((item) => item !== period) : [...current, period];
    updateField('selectedPeriods', next);
  };

  return (
    <>
      {showActivitySelect ? (
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">活動</span>
          <select
            value={formData.activityId}
            onChange={(event) => handleActivityChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          >
            <option value="">請選擇活動</option>
            {activityOptions.map((activity) => (
              <option key={activity.id} value={activity.id}>{activity.title}</option>
            ))}
          </select>
        </label>
      ) : null}

      {periodOptions.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">報名期數（可複選）</legend>
          <div className="grid gap-2 md:grid-cols-2">
            {periodOptions.map((period) => (
              <label key={period} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formData.selectedPeriods || []).includes(period)}
                  onChange={() => handleTogglePeriod(period)}
                />
                {period}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

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
              name={`${namePrefix}-gender`}
              checked={formData.gender === 'male'}
              onChange={() => updateField('gender', 'male')}
            />
            生理男
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={`${namePrefix}-gender`}
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
            <input type="radio" name={`${namePrefix}-identity`} checked={formData.identity === 'member'} onChange={() => updateField('identity', 'member')} />有效會員
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name={`${namePrefix}-identity`} checked={formData.identity === 'memberFamily'} onChange={() => updateField('identity', 'memberFamily')} />會員回娘家
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name={`${namePrefix}-identity`} checked={formData.identity === 'newMember'} onChange={() => updateField('identity', 'newMember')} />新入會(欲加入會員)
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name={`${namePrefix}-identity`} checked={formData.identity === 'nonMember'} onChange={() => updateField('identity', 'nonMember')} />非會員
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
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'member'} onChange={() => updateField('referralSource', 'member')} />本身是會員</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'friend'} onChange={() => updateField('referralSource', 'friend')} />朋友介紹</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'flyer'} onChange={() => updateField('referralSource', 'flyer')} />臉書看到</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'officialSite'} onChange={() => updateField('referralSource', 'officialSite')} />本會官網看到</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'beclass'} onChange={() => updateField('referralSource', 'beclass')} />BeClass網站看到</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name={`${namePrefix}-referral`} checked={formData.referralSource === 'other'} onChange={() => updateField('referralSource', 'other')} />其他</label>
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
    </>
  );
};

export default ActivityRegistrationFormFields;
