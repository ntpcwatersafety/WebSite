import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Save, LogOut, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import {
  getMemberSession,
  getMemberProfileBySession,
  updateMemberProfile,
  changeMemberPassword,
  logoutMember,
} from '../services/memberService';
import MemberFormFields, { MemberFormData } from '../components/MemberFormFields';
import { MemberProfile as MemberProfileType } from '../types';

const MemberProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as any)?.registered;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MemberFormData | null>(null);
  const [draft, setDraft] = useState<MemberFormData | null>(null);
  const [successMsg, setSuccessMsg] = useState(justRegistered ? '註冊成功！歡迎加入新北市水上安全協會。' : '');
  const [errorMsg, setErrorMsg] = useState('');

  // 修改密碼區塊
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    const session = getMemberSession();
    if (!session) {
      navigate('/member/login');
      return;
    }
    getMemberProfileBySession().then(profile => {
      if (!profile) { navigate('/member/login'); return; }
      const data: MemberFormData = {
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        addressCounty: profile.addressCounty,
        addressDistrict: profile.addressDistrict,
        addressDetail: profile.addressDetail,
        idNumber: profile.idNumber,
        birthDate: profile.birthDate,
        identity: profile.identity,
        coachCertYear: profile.coachCertYear,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone,
        emergencyContactRelation: profile.emergencyContactRelation,
        souvenirReceived: profile.souvenirReceived,
        souvenirReceiveDate: profile.souvenirReceiveDate,
      };
      setForm(data);
      setDraft(data);
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !form) return;
    setErrorMsg('');
    setSuccessMsg('');
    if (!draft.name.trim()) { setErrorMsg('請填寫姓名'); return; }
    if (!draft.birthDate) { setErrorMsg('請選擇出生日期'); return; }

    setSaving(true);
    try {
      await updateMemberProfile(form.email, draft);
      setForm(draft);
      setSuccessMsg('資料已儲存');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || '儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (newPwd.length < 8) { setPwdError('新密碼至少需要 8 個字元'); return; }
    if (newPwd !== confirmNewPwd) { setPwdError('兩次密碼不一致'); return; }
    setSavingPwd(true);
    try {
      await changeMemberPassword(form!.email, oldPwd, newPwd);
      setPwdSuccess('密碼已更新');
      setOldPwd(''); setNewPwd(''); setConfirmNewPwd('');
      setShowChangePwd(false);
    } catch (err: any) {
      setPwdError(err.message || '密碼更新失敗');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    logoutMember();
    navigate('/member/login');
  };

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-78px)] items-center justify-center">
        <span className="text-gray-400">載入中...</span>
      </main>
    );
  }

  if (!draft) return null;

  return (
    <main className="bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">會員資料</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={15} />
            登出
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}
        {pwdSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={16} />
            {pwdSuccess}
          </div>
        )}

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSave} className="space-y-5">
            <MemberFormFields
              data={draft}
              onChange={handleChange}
              showEmail
              emailReadonly
            />

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:bg-gray-300"
            >
              <Save size={16} />
              {saving ? '儲存中...' : '儲存資料'}
            </button>
          </form>

          {/* 修改密碼 */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => setShowChangePwd(v => !v)}
              className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
            >
              <Lock size={14} />
              {showChangePwd ? '取消修改密碼' : '修改密碼'}
            </button>

            {showChangePwd && (
              <form onSubmit={handleChangePwd} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">目前密碼</label>
                    <input
                      type="password"
                      required
                      value={oldPwd}
                      onChange={e => setOldPwd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">新密碼</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      placeholder="至少 8 個字元"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">確認新密碼</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPwd}
                      onChange={e => setConfirmNewPwd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {pwdError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {pwdError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPwd}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:bg-gray-300"
                >
                  {savingPwd ? '更新中...' : '確認修改密碼'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MemberProfile;
