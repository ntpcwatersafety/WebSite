import React, { useState } from 'react';
import {
  FileText, Newspaper, Images, Award, Heart, Settings,
  ChevronRight
} from 'lucide-react';
import AdminIntro from './AdminIntro';
import AdminNews from './AdminNews';
import AdminGallery from './AdminGallery';
import AdminMedia from './AdminMedia';
import AdminAwards from './AdminAwards';
import AdminThankYou from './AdminThankYou';

interface AdminDashboardProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'intro' | 'news' | 'gallery' | 'media' | 'awards' | 'thankyou';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('intro');

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'intro', label: '協會簡介', icon: <FileText size={20} /> },
    { id: 'news', label: '最新消息', icon: <Newspaper size={20} /> },
    { id: 'gallery', label: '活動相簿', icon: <Images size={20} /> },
    { id: 'media', label: '媒體報導', icon: <Settings size={20} /> },
    { id: 'awards', label: '獲獎紀錄', icon: <Award size={20} /> },
    { id: 'thankyou', label: '感恩有您', icon: <Heart size={20} /> },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg font-medium transition gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.icon}
            <span className="text-xs sm:text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'intro' && (
          <AdminIntro onShowToast={onShowToast} />
        )}
        {activeTab === 'news' && (
          <AdminNews onShowToast={onShowToast} />
        )}
        {activeTab === 'gallery' && (
          <AdminGallery onShowToast={onShowToast} />
        )}
        {activeTab === 'media' && (
          <AdminMedia onShowToast={onShowToast} />
        )}
        {activeTab === 'awards' && (
          <AdminAwards onShowToast={onShowToast} />
        )}
        {activeTab === 'thankyou' && (
          <AdminThankYou onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
