import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { NewsItem } from '../../types';
import { getHomeNews } from '../../services/cmsLoader';
import { createNewsItem, updateNewsItem, deleteNewsItem } from '../../services/supabaseAdmin';

interface AdminNewsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminNews: React.FC<AdminNewsProps> = ({ onShowToast }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await getHomeNews();
      setNews(data);
    } catch (error) {
      onShowToast('載入最新消息失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    try {
      const newItem: Omit<NewsItem, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        title: '新消息',
        description: '',
        link: '',
        isNew: true,
        isPinned: false,
      };
      await createNewsItem(newItem);
      onShowToast('新消息已新增', 'success');
      loadNews();
    } catch (error) {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateNews = async (id: string, updates: Partial<NewsItem>) => {
    try {
      await updateNewsItem(id, updates);
      onShowToast('消息已更新', 'success');
      setEditingId(null);
      loadNews();
    } catch (error) {
      onShowToast('更新失敗', 'error');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('確定要刪除此消息嗎？')) return;
    try {
      await deleteNewsItem(id);
      onShowToast('消息已刪除', 'success');
      loadNews();
    } catch (error) {
      onShowToast('刪除失敗', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">最新消息</h2>
        <button
          onClick={handleAddNews}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增消息
        </button>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">日期</label>
                <input
                  type="date"
                  value={item.date || ''}
                  onChange={(e) => handleUpdateNews(item.id, { date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">標題</label>
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => handleUpdateNews(item.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => handleUpdateNews(item.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">連結</label>
                <input
                  type="url"
                  value={item.link || ''}
                  onChange={(e) => handleUpdateNews(item.id, { link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isNew || false}
                    onChange={(e) => handleUpdateNews(item.id, { isNew: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">標記為新</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isPinned || false}
                    onChange={(e) => handleUpdateNews(item.id, { isPinned: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">釘選</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteNews(item.id)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={16} />
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {news.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無最新消息</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>每條消息逐項即存。勾選「釘選」可在首頁置頂顯示。</p>
      </div>
    </div>
  );
};

export default AdminNews;
