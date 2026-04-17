import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Play } from 'lucide-react';
import { MediaItem } from '../../types';
import { getMediaReports } from '../../services/cmsLoader';
import { createMediaReport, updateMediaReport, deleteMediaReport } from '../../services/supabaseAdmin';

interface AdminMediaProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const isYouTubeLink = (url?: string) => {
  if (!url) return false;
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, '').toLowerCase();
    return ['youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname);
  } catch {
    return false;
  }
};

interface MediaRowProps {
  item: MediaItem;
  onUpdate: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MediaRow: React.FC<MediaRowProps> = ({ item, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState({ ...item });

  const save = (field: keyof MediaItem, value: any) => {
    if (draft[field] !== item[field]) {
      onUpdate(item.id, { [field]: value });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {isYouTubeLink(draft.link) && (
        <div className="mb-4 bg-gray-100 rounded-lg p-2 flex items-center gap-2 text-sm text-blue-600">
          <Play size={16} />
          <span>YouTube 連結已偵測，前台會自動顯示影片預覽</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">日期</label>
          <input
            type="date"
            value={draft.date || ''}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            onBlur={(e) => save('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">類型</label>
          <select
            value={draft.type || 'news'}
            onChange={(e) => { setDraft({ ...draft, type: e.target.value }); onUpdate(item.id, { type: e.target.value }); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="news">新聞</option>
            <option value="video">影片</option>
            <option value="article">文章</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">標題</label>
          <input
            type="text"
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={(e) => save('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">來源</label>
          <input
            type="text"
            value={draft.source || ''}
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
            onBlur={(e) => save('source', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">連結</label>
          <input
            type="url"
            value={draft.link || ''}
            onChange={(e) => setDraft({ ...draft, link: e.target.value })}
            onBlur={(e) => save('link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="https://..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 size={16} />
            刪除
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminMedia: React.FC<AdminMediaProps> = ({ onShowToast }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await getMediaReports();
      setMedia(data);
    } catch (error) {
      onShowToast('載入媒體報導失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = async () => {
    try {
      const newItem: Omit<MediaItem, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        title: '新媒體報導',
        source: '',
        link: '',
        type: 'news',
      };
      await createMediaReport(newItem);
      onShowToast('媒體報導已新增', 'success');
      loadMedia();
    } catch (error) {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateMedia = async (id: string, updates: Partial<MediaItem>) => {
    try {
      await updateMediaReport(id, updates);
      setMedia(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      onShowToast('媒體報導已更新', 'success');
    } catch (error) {
      onShowToast('更新失敗', 'error');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('確定要刪除此媒體報導嗎？')) return;
    try {
      await deleteMediaReport(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      onShowToast('媒體報導已刪除', 'success');
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
        <h2 className="text-2xl font-bold text-gray-900">媒體報導</h2>
        <button
          onClick={handleAddMedia}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增報導
        </button>
      </div>

      <div className="space-y-4">
        {media.map((item) => (
          <MediaRow key={item.id} item={item} onUpdate={handleUpdateMedia} onDelete={handleDeleteMedia} />
        ))}
      </div>

      {media.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無媒體報導</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>每條報導逐項即存。填入 YouTube 連結時，前台會自動顯示影片預覽。</p>
      </div>
    </div>
  );
};

export default AdminMedia;
