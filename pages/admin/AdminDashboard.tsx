import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FileText, Newspaper, Images, Award, Heart, Settings,
  ChevronRight, HardDrive
} from 'lucide-react';

const menuItems = [
  { path: '/admin/intro',        label: '協會簡介', icon: <FileText size={20} /> },
  { path: '/admin/news',         label: '最新消息', icon: <Newspaper size={20} /> },
  { path: '/admin/activities',   label: '報名資訊', icon: <Images size={20} /> },
  { path: '/admin/results',      label: '訓練成果', icon: <Images size={20} /> },
  { path: '/admin/gallery',      label: '活動剪影', icon: <Images size={20} /> },
  { path: '/admin/media',        label: '媒體報導', icon: <Settings size={20} /> },
  { path: '/admin/awards',       label: '獲獎紀錄', icon: <Award size={20} /> },
  { path: '/admin/thankyou',     label: '感恩有您', icon: <Heart size={20} /> },
  { path: '/admin/medialibrary', label: '圖檔管理', icon: <HardDrive size={20} /> },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex gap-6">
      {/* 左側選單 */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {item.icon}
                <span className="flex-grow text-left">{item.label}</span>
                {active && <ChevronRight size={18} />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 右側內容 */}
      <div className="flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
