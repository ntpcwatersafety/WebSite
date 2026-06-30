import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FileText, Newspaper, Images, Award, Heart, Settings,
  ChevronRight, ChevronLeft, PanelLeftClose, HardDrive, Users, Mail
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
  { path: '/admin/mailtemplates', label: '信件樣版', icon: <Mail size={20} /> },
  { path: '/admin/members',      label: '會員管理', icon: <Users size={20} /> },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  return (
    <div className="flex gap-6">
      {/* 左側選單 */}
      <div className={`${isMenuCollapsed ? 'w-20' : 'w-48'} flex-shrink-0 transition-all duration-200`}>
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsMenuCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            title={isMenuCollapsed ? '展開選單' : '收合選單'}
          >
            {isMenuCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!isMenuCollapsed && <PanelLeftClose size={14} />}
          </button>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isMenuCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
                title={item.label}
              >
                {item.icon}
                {!isMenuCollapsed && <span className="flex-grow text-left">{item.label}</span>}
                {!isMenuCollapsed && active && <ChevronRight size={18} />}
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
