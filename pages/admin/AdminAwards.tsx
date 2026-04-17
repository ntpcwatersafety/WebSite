import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { AwardItem } from '../../types';
import { getAwards } from '../../services/cmsLoader';
import { createAward, updateAward, deleteAward } from '../../services/supabaseAdmin';

interface AdminAwardsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface AwardRowProps {
  item: AwardItem;
  onUpdate: (id: string, updates: Partial<AwardItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AwardRow: React.FC<AwardRowProps> = ({ item, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState({ ...item });

  const save = (field: keyof AwardItem, value: any) => {
    if (draft[field] !== item[field]) {
      onUpdate(item.id, { [field]: value });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">年份</label>
          <input
            type="text"
            value={draft.year || ''}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            onBlur={(e) => save('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">圖示代碼（Emoji 或類別）</label>
          <input
            type="text"
            value={draft.icon || ''}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            onBlur={(e) => save('icon', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="🏆"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">獎項名稱</label>
          <input
            type="text"
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={(e) => save('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">說明</label>
          <textarea
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            onBlur={(e) => save('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
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

const AdminAwards: React.FC<AdminAwardsProps> = ({ onShowToast }) => {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAwards();
  }, []);

  const loadAwards = async () => {
    try {
      const data = await getAwards();
      setAwards(data);
    } catch (error) {
      onShowToast('載入獲獎紀錄失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAward = async () => {
    try {
      const newItem: Omit<AwardItem, 'id'> = {
        year: new Date().getFullYear().toString(),
        title: '新獲獎紀錄',
        description: '',
        icon: '',
      };
      await createAward(newItem);
      onShowToast('獲獎紀錄已新增', 'success');
      loadAwards();
    } catch (error) {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateAward = async (id: string, updates: Partial<AwardItem>) => {
    try {
      await updateAward(id, updates);
      setAwards(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      onShowToast('獲獎紀錄已更新', 'success');
    } catch (error) {
      onShowToast('更新失敗', 'error');
    }
  };

  const handleDeleteAward = async (id: string) => {
    if (!confirm('確定要刪除此獲獎紀錄嗎？')) return;
    try {
      await deleteAward(id);
      setAwards(prev => prev.filter(a => a.id !== id));
      onShowToast('獲獎紀錄已刪除', 'success');
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
        <h2 className="text-2xl font-bold text-gray-900">獲獎紀錄</h2>
        <button
          onClick={handleAddAward}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增獎項
        </button>
      </div>

      <div className="space-y-4">
        {awards.map((item) => (
          <AwardRow key={item.id} item={item} onUpdate={handleUpdateAward} onDelete={handleDeleteAward} />
        ))}
      </div>

      {awards.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無獲獎紀錄</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>每條獲獎紀錄逐項即存。可填入 Emoji 或文字作為圖示。</p>
      </div>
    </div>
  );
};

export default AdminAwards;
