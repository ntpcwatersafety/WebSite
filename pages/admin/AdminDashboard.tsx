import React, { useState } from 'react';
import {
  FileText, Newspaper, Images, Award, Heart, Settings,
  ChevronRight, FolderImage
} from 'lucide-react';
import AdminIntro from './AdminIntro';
import AdminNews from './AdminNews';
import AdminActivities from './AdminActivities';
import AdminResults from './AdminResults';
import AdminGallery from './AdminGallery';
import AdminMedia from './AdminMedia';
import AdminAwards from './AdminAwards';
import AdminThankYou from './AdminThankYou';
import AdminMediaLibrary from './AdminMediaLibrary';

interface AdminDashboardProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'intro' | 'news' | 'activities' | 'results' | 'gallery' | 'media' | 'awards' | 'thankyou' | 'medialibrary';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('intro');

  const menuItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'intro', label: '協會簡介', icon: <FileText size={20} /> },
    { id: 'news', label: '最新消息', icon: <Newspaper size={20} /> },
    { id: 'activities', label: '報名資訊', icon: <Images size={20} /> },
    { id: 'results', label: '訓練成果', icon: <Images size={20} /> },
    { id: 'gallery', label: '活動剪影', icon: <Images size={20} /> },
    { id: 'media', label: '媒體報導', icon: <Settings size={20} /> },
    { id: 'awards', label: '獲獎紀錄', icon: <Award size={20} /> },
    { id: 'thankyou', label: '感恩有您', icon: <Heart size={20} /> },
    { id: 'medialibrary', label: '圖檔管理', icon: <FolderImage size={20} /> },
  ];

  return (
    <div className="flex gap-6">
      {/* Left Sidebar Menu */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              {item.icon}
              <span className="flex-grow text-left">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={18} />}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'intro' && <AdminIntro onShowToast={onShowToast} />}
          {activeTab === 'news' && <AdminNews onShowToast={onShowToast} />}
          {activeTab === 'activities' && <AdminActivities onShowToast={onShowToast} />}
          {activeTab === 'results' && <AdminResults onShowToast={onShowToast} />}
          {activeTab === 'gallery' && <AdminGallery onShowToast={onShowToast} />}
          {activeTab === 'media' && <AdminMedia onShowToast={onShowToast} />}
          {activeTab === 'awards' && <AdminAwards onShowToast={onShowToast} />}
          {activeTab === 'thankyou' && <AdminThankYou onShowToast={onShowToast} />}
          {activeTab === 'medialibrary' && <AdminMediaLibrary onShowToast={onShowToast} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
