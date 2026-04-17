import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { logout, onAuthStateChange } from '../services/supabaseAuth';
import AdminLogin from './admin/AdminLogin';
import AdminFeedbackToast from '../components/AdminFeedbackToast';
import { ToastProvider, useToast } from '../contexts/ToastContext';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { messages, dismiss } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin');
    } catch {
      // ignore
    }
  };

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
        <Outlet />
      </main>

      <AdminFeedbackToast messages={messages} onDismiss={dismiss} />
    </div>
  );
};

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: subscription } = onAuthStateChange((authenticated) => {
      setIsAuthenticated(authenticated);
      setLoading(false);
    });
    return () => { subscription?.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
      <AdminLayout />
    </ToastProvider>
  );
};

export default Admin;
