import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { registerMember } from '../services/memberService';
import MemberFormFields, { MemberFormData } from '../components/MemberFormFields';

const emptyForm = (): MemberFormData => ({
  email: '',
  name: '',
  phone: '',
  addressCounty: '',
  addressDistrict: '',
  addressDetail: '',
  idNumber: '',
  birthDate: '',
  identity: 'member',
  coachCertYear: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  souvenirReceived: false,
  souvenirReceiveDate: '',
});

const MemberRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<MemberFormData>(emptyForm());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('請填寫姓名'); return; }
    if (!form.birthDate) { setError('請選擇出生日期'); return; }
    if (password.length < 8) { setError('密碼至少需要 8 個字元'); return; }
    if (password !== confirmPassword) { setError('兩次密碼輸入不一致'); return; }

    setLoading(true);
    try {
      await registerMember(form, password);
      navigate('/member/profile', { state: { registered: true } });
    } catch (err: any) {
      setError(err.message || '註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-primary">會員註冊</h1>
          <p className="mb-6 text-center text-sm text-gray-500">新北市水上安全協會 會員加入</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <MemberFormFields
              data={form}
              onChange={handleChange}
              showEmail
              emailReadonly={false}
              showPasswordFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:bg-gray-300"
            >
              {loading ? '註冊中...' : (<><UserPlus size={16} />送出註冊</>)}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            已有帳號？{' '}
            <Link to="/member/login" className="text-cyan-600 hover:underline">
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default MemberRegister;
