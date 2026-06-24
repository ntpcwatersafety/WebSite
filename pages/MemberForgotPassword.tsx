import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '../services/memberService';
import { sendPasswordResetEmail } from '../services/cms';

const MemberForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatus('loading');

    try {
      const { name, token } = await requestPasswordReset(email);

      const resetLink = `${window.location.origin}${window.location.pathname}#/member/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        toName: name,
        toEmail: email.trim().toLowerCase(),
        resetLink,
      });

      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || '發送失敗，請稍後再試');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
          <h2 className="mb-2 text-xl font-bold text-gray-800">信件已寄出</h2>
          <p className="mb-6 text-sm text-gray-500">
            請檢查您的信箱，按照信中的連結重設密碼。<br />
            （連結將在 1 小時後失效）
          </p>
          <Link
            to="/member/login"
            className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:underline"
          >
            <ArrowLeft size={14} />
            返回登入
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-primary">忘記密碼</h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            輸入您的 Email，我們將寄送密碼重設連結給您。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:bg-gray-300"
            >
              {status === 'loading' ? '寄送中...' : '寄送重設連結'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/member/login" className="text-cyan-600 hover:underline">
              返回登入
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MemberForgotPassword;
