import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, GripVertical } from 'lucide-react';
import { ThankYouItem } from '../../types';
import { getThankYouItems } from '../../services/cmsLoader';
import { createThankYouItem, updateThankYouItem, deleteThankYouItem } from '../../services/supabaseAdmin';

interface AdminThankYouProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminThankYou: React.FC<AdminThankYouProps> = ({ onShowToast }) => {
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
      onShowToast('載入感恩有您失敗', 'error');
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
      onShowToast('感恩項目已新增', 'success');
      loadItems();
    } catch (error) {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ThankYouItem>) => {
    try {
      await updateThankYouItem(id, updates);
      onShowToast('感恩項目已更新', 'success');
      loadItems();
    } catch (error) {
      onShowToast('更新失敗', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('確定要刪除此感恩項目嗎？')) return;
    try {
      await deleteThankYouItem(id);
      onShowToast('感恩項目已刪除', 'success');
      loadItems();
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
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">年份</label>
                <input
                  type="text"
                  value={item.year || ''}
                  onChange={(e) => handleUpdateItem(item.id, { year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序順序</label>
                <input
                  type="number"
                  value={item.sortOrder || 0}
                  onChange={(e) => handleUpdateItem(item.id, { sortOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">說明</label>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteItem(item.id)}
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

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無感恩項目</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>每個感恩項目逐項即存。可編輯排序順序來調整在頁面上的顯示位置。</p>
      </div>
    </div>
  );
};

export default AdminThankYou;
