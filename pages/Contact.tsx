import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import Hero from '../components/Hero';
import { sendContactEmail, PAGE_CONTENT } from '../services/cms';
import { ContactFormData } from '../types';

const Contact: React.FC = () => {
  const pageData = PAGE_CONTENT.contact;

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // 這裡呼叫 mock API
      await sendContactEmail(formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <>
      <Hero 
        title={pageData.title}
        subtitle={pageData.subtitle}
        imageUrl={pageData.imageUrl}
      />
      <main className="container max-w-[800px] mx-auto my-12 px-5">
        <div className="bg-white rounded-lg shadow-md border-t-4 border-primary p-8 md:p-12">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-primary mb-4">聯絡我們</h2>
            <p className="text-gray-600">
              有任何疑問或合作需求？歡迎填寫下方表單，我們將儘速回覆您。<br/>
              (預設寄送至: 123@gmail.com)
            </p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center animate-fade-in">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700 mb-2">發送成功！</h3>
              <p className="text-green-600">我們已收到您的訊息，將儘快與您聯繫。</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                發送另一則訊息
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">姓名</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                    placeholder="您的稱呼"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子郵件</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">主旨</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                  placeholder="詢問課程 / 活動報名"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">訊息內容</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition resize-none"
                  placeholder="請在此輸入您的訊息..."
                ></textarea>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle size={20} />
                  <span>發送失敗，請稍後再試。</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md text-white font-semibold text-lg transition-all ${
                  status === 'submitting' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-secondary shadow-lg hover:shadow-xl'
                }`}
              >
                {status === 'submitting' ? '發送中...' : (
                  <>
                    發送訊息 <Send size={20} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
};

export default Contact;