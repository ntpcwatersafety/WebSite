import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { resetPasswordByToken } from '../services/memberService';

const MemberResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const t = params.get('token') || '';
    if (!t) {
      setStatus('error');
      setErrorMsg('重設連結無效，請重新申請忘記密碼。');
    }
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPwd.length < 8) { setErrorMsg('密碼至少需要 8 個字元'); return; }
    if (newPwd !== confirmPwd) { setErrorMsg('兩次密碼不一致'); return; }
    setStatus('loading');
    try {
      await resetPasswordByToken(token, newPwd);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || '重設失敗，請稍後再試');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
          <h2 className="mb-2 text-xl font-bold text-gray-800">密碼已重設</h2>
          <p className="mb-6 text-sm text-gray-500">請使用新密碼登入。</p>
          <button
            type="button"
            onClick={() => navigate('/member/login')}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            前往登入
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-primary">重設密碼</h1>
          <p className="mb-6 text-center text-sm text-gray-500">請輸入您的新密碼。</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">新密碼</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="至少 8 個字元"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">確認新密碼</label>
              <input
                type="password"
                required
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="再次輸入新密碼"
                autoComplete="new-password"
              />
            </div>

            {(status === 'error' || errorMsg) && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !token}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:bg-gray-300"
            >
              {status === 'loading' ? '處理中...' : '確認重設密碼'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/member/forgot-password" className="text-cyan-600 hover:underline">
              重新申請忘記密碼
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MemberResetPassword;
