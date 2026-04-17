import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { logout, onAuthStateChange } from '../services/supabaseAuth';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminFeedbackToast from '../components/AdminFeedbackToast';

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const { data: subscription } = onAuthStateChange((authenticated) => {
      setIsAuthenticated(authenticated);
      setLoading(false);
    });
    return () => { subscription?.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      showToast('登出成功', 'success');
    } catch {
      showToast('登出失敗', 'error');
    }
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    if (type === 'info') return;
    const id = Date.now();
    setMessages(prev => [...prev, { id, type, text: message }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
  }, []);

  const handleDismiss = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">後台管理</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              返回首頁
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">登出</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard onShowToast={showToast} />
      </main>

      <AdminFeedbackToast messages={messages} onDismiss={handleDismiss} />
    </div>
  );
};

export default Admin;
