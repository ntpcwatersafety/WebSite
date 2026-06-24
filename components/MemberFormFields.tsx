import React from 'react';
import { MemberProfile, MemberIdentity } from '../types';
import MemberDatePicker from './MemberDatePicker';
import { TAIWAN_DISTRICTS } from '../services/memberService';

export interface MemberFormData extends Omit<MemberProfile, 'id' | 'createdAt'> {}

interface MemberFormFieldsProps {
  data: MemberFormData;
  onChange: <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => void;
  showEmail?: boolean;
  emailReadonly?: boolean;
  showPassword?: boolean;
  password?: string;
  confirmPassword?: string;
  onPasswordChange?: (v: string) => void;
  onConfirmPasswordChange?: (v: string) => void;
  showPasswordFields?: boolean;
}

const IDENTITY_OPTIONS: { value: MemberIdentity; label: string }[] = [
  { value: 'coach', label: '教練' },
  { value: 'team', label: '隊員（具有本會救生員證）' },
  { value: 'member', label: '會員（尚未具有本會救生員證）' },
  { value: 'new', label: '新入會（首次繳交入會費及會員費）' },
];

const RELATION_OPTIONS = ['父母', '配偶', '子女', '兄弟姊妹', '朋友', '同事', '其他'];

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

const MemberFormFields: React.FC<MemberFormFieldsProps> = ({
  data,
  onChange,
  showEmail = true,
  emailReadonly = false,
  password = '',
  confirmPassword = '',
  onPasswordChange,
  onConfirmPasswordChange,
  showPasswordFields = false,
}) => {
  const districts = data.addressCounty ? (TAIWAN_DISTRICTS[data.addressCounty] || []) : [];

  const handleCountyChange = (county: string) => {
    onChange('addressCounty', county);
    onChange('addressDistrict', '');
  };

  return (
    <>
      {/* ── Email ─────────────────────────────────────────── */}
      {showEmail && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            readOnly={emailReadonly}
            value={data.email}
            onChange={e => onChange('email', e.target.value)}
            className={`${inputCls} ${emailReadonly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            placeholder="example@email.com"
          />
          {emailReadonly && (
            <p className="text-xs text-gray-400">Email 為登入帳號，不可修改</p>
          )}
        </div>
      )}

      {/* ── 密碼欄位 ──────────────────────────────────────── */}
      {showPasswordFields && onPasswordChange && onConfirmPasswordChange && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              密碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              className={inputCls}
              placeholder="至少 8 個字元"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              確認密碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => onConfirmPasswordChange(e.target.value)}
              className={inputCls}
              placeholder="再次輸入密碼"
              autoComplete="new-password"
            />
          </div>
        </div>
      )}

      {/* ── 基本資料區塊 ──────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">基本資料</h3>

        <div className="space-y-4">
          {/* 姓名 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={data.name}
                onChange={e => onChange('name', e.target.value)}
                className={inputCls}
                placeholder="請輸入姓名"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">行動電話</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={data.phone}
                onChange={e => onChange('phone', e.target.value.replace(/\D/g, ''))}
                className={inputCls}
                placeholder="09xxxxxxxx"
              />
            </div>
          </div>

          {/* 地址 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">地址</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={data.addressCounty}
                onChange={e => handleCountyChange(e.target.value)}
                className={inputCls}
              >
                <option value="">縣/市</option>
                {Object.keys(TAIWAN_DISTRICTS).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={data.addressDistrict}
                onChange={e => onChange('addressDistrict', e.target.value)}
                className={inputCls}
                disabled={!data.addressCounty}
              >
                <option value="">區域</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={data.addressDetail}
              onChange={e => onChange('addressDetail', e.target.value)}
              className={`${inputCls} mt-2`}
              placeholder="詳細地址（路、街、巷、弄、號）"
            />
          </div>

          {/* 身分證 + 生日 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">身分證字號</label>
              <input
                type="text"
                maxLength={10}
                value={data.idNumber}
                onChange={e => onChange('idNumber', e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="A123456789"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                生日 <span className="text-red-500">*</span>
              </label>
              <MemberDatePicker
                value={data.birthDate}
                onChange={v => onChange('birthDate', v)}
                placeholder="請選擇出生日期"
              />
            </div>
          </div>

          {/* 身分 */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">
              身分 <span className="text-red-500">*</span>
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {IDENTITY_OPTIONS.map(opt => (
                <label key={opt.value} className="inline-flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="member-identity"
                    checked={data.identity === opt.value}
                    onChange={() => onChange('identity', opt.value)}
                    className="mt-0.5"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 教練證年份 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">民國幾年取得教練證</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={data.coachCertYear}
              onChange={e => onChange('coachCertYear', e.target.value.replace(/\D/g, ''))}
              className={`${inputCls} max-w-[160px]`}
              placeholder="例如：112"
            />
          </div>

          {/* 緊急聯絡人 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">緊急聯絡人</label>
              <input
                type="text"
                value={data.emergencyContactName}
                onChange={e => onChange('emergencyContactName', e.target.value)}
                className={inputCls}
                placeholder="姓名"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">緊急聯絡人電話</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={data.emergencyContactPhone}
                onChange={e => onChange('emergencyContactPhone', e.target.value.replace(/\D/g, ''))}
                className={inputCls}
                placeholder="09xxxxxxxx"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">關係</label>
              <select
                value={data.emergencyContactRelation}
                onChange={e => onChange('emergencyContactRelation', e.target.value)}
                className={inputCls}
              >
                <option value="">請選擇</option>
                {RELATION_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── 本年度資料區塊 ──────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">本年度資料</h3>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">本年度紀念品</legend>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="souvenir"
                  checked={data.souvenirReceived === true}
                  onChange={() => onChange('souvenirReceived', true)}
                />
                已領取
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="souvenir"
                  checked={data.souvenirReceived === false}
                  onChange={() => onChange('souvenirReceived', false)}
                />
                未領取
              </label>
            </div>
          </fieldset>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">紀念品領取日期</label>
            <MemberDatePicker
              value={data.souvenirReceiveDate}
              onChange={v => onChange('souvenirReceiveDate', v)}
              placeholder="請選擇日期（選填）"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberFormFields;
