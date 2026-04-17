import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { ThankYouItem } from '../../types';
import { getThankYouItems } from '../../services/cmsLoader';
import { createThankYouItem, updateThankYouItem, deleteThankYouItem } from '../../services/supabaseAdmin';
import { useToast } from '../../contexts/ToastContext';


interface ThankYouRowProps {
  item: ThankYouItem;
  onUpdate: (id: string, updates: Partial<ThankYouItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ThankYouRow: React.FC<ThankYouRowProps> = ({ item, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState({ ...item });

  const handleSave = () => {
    onUpdate(item.id, {
      name: draft.name,
      year: draft.year,
      sortOrder: draft.sortOrder,
      description: draft.description,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">名稱</label>
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">年份</label>
          <input
            type="text"
            value={draft.year || ''}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">排序順序</label>
          <input
            type="number"
            value={draft.sortOrder || 0}
            onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">說明</label>
          <textarea
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Save size={16} />
            保存
          </button>
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

const AdminThankYou: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ThankYouItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getThankYouItems();
      setItems(data);
    } catch (error) {
      showToast('載入感恩有您失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const newItem: Omit<ThankYouItem, 'id'> = {
        name: '新感謝對象',
        year: new Date().getFullYear().toString(),
        sortOrder: items.length + 1,
        description: '',
      };
      await createThankYouItem(newItem);
      showToast('感恩項目已新增', 'success');
      loadItems();
    } catch (error) {
      showToast('新增失敗', 'error');
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ThankYouItem>) => {
    try {
      await updateThankYouItem(id, updates);
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      showToast('感恩項目已更新', 'success');
    } catch (error) {
      showToast('更新失敗', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('確定要刪除此感恩項目嗎？')) return;
    try {
      await deleteThankYouItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('感恩項目已刪除', 'success');
    } catch (error) {
      showToast('刪除失敗', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">感恩有您</h2>
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增項目
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <ThankYouRow key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無感恩項目</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>編輯後按「保存」才會寫入資料庫。可編輯排序順序來調整在頁面上的顯示位置。</p>
      </div>
    </div>
  );
};

export default AdminThankYou;
