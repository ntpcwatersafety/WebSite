import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, CheckCircle, GripVertical } from 'lucide-react';
import { ThankYouItem } from '../../types';
import { getThankYouItems } from '../../services/cmsLoader';
import { createThankYouItem, updateThankYouItem, deleteThankYouItem } from '../../services/supabaseAdmin';
import { sortThankYouItems } from '../../services/sortUtils';
import { useToast } from '../../contexts/ToastContext';

type EditorMode = 'add' | 'edit' | null;

const reorderByIds = (items: ThankYouItem[], dragId: string, dropId: string): ThankYouItem[] => {
  if (dragId === dropId) return items;
  const sourceIndex = items.findIndex((item) => item.id === dragId);
  const targetIndex = items.findIndex((item) => item.id === dropId);
  if (sourceIndex < 0 || targetIndex < 0) return items;

  const next = [...items];
  const [dragItem] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, dragItem);
  return next;
};

const AdminThankYou: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ThankYouItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [draft, setDraft] = useState<ThankYouItem | null>(null);

  const sortedItems = useMemo(() => sortThankYouItems(items), [items]);

  useEffect(() => {
    void loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getThankYouItems();
      setItems(data);
    } catch {
      showToast('載入感恩有您失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: ThankYouItem) => {
    setEditorMode('edit');
    setEditingId(item.id);
    setDraft({ ...item });
  };

  const startAdd = () => {
    const maxOrder = sortedItems.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);
    setEditorMode('add');
    setEditingId(null);
    setDraft({
      id: '',
      name: '',
      year: new Date().getFullYear().toString(),
      sortOrder: maxOrder + 10,
      description: '',
    });
  };

  const cancelEdit = () => {
    setEditorMode(null);
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name?.trim()) {
      showToast('請輸入名稱', 'error');
      return;
    }

    const payload: Omit<ThankYouItem, 'id'> = {
      name: draft.name,
      year: draft.year,
      sortOrder: draft.sortOrder,
      description: draft.description,
    };

    try {
      if (editorMode === 'add') {
        await createThankYouItem(payload);
        await loadItems();
        showToast('感恩項目已新增', 'success');
      } else if (editorMode === 'edit' && editingId) {
        await updateThankYouItem(editingId, payload);
        setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
        showToast('感恩項目已更新', 'success');
      }

      cancelEdit();
    } catch {
      showToast(editorMode === 'add' ? '新增失敗' : '更新失敗', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('確定要刪除此感恩項目嗎？')) return;
    try {
      await deleteThankYouItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      showToast('感恩項目已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleDrop = async (dropId: string) => {
    if (!dragId) return;

    const reordered = reorderByIds(sortedItems, dragId, dropId);
    setDragId(null);
    setOverId(null);

    const next = reordered.map((item, index) => ({
      ...item,
      sortOrder: (index + 1) * 10,
    }));

    setItems(next);
    if (editingId) {
      const nextEditing = next.find((item) => item.id === editingId);
      if (nextEditing) setDraft({ ...nextEditing });
    }

    setSavingOrder(true);
    try {
      await Promise.all(next.map((item) => updateThankYouItem(item.id, { sortOrder: item.sortOrder })));
      showToast('排序已保存', 'success');
    } catch {
      showToast('保存排序失敗，已重新載入', 'error');
      await loadItems();
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">感恩有您</h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增項目
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600 flex items-center justify-between">
          <span>列表（可拖拉排序）</span>
          {savingOrder && <span className="text-blue-600">排序儲存中...</span>}
        </div>

        {sortedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-600">尚無感恩項目</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedItems.map((item) => (
              <li
                key={item.id}
                draggable={!savingOrder}
                onDragStart={() => setDragId(item.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!savingOrder) setOverId(item.id);
                }}
                onDragLeave={() => setOverId((current) => (current === item.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleDrop(item.id);
                }}
                className={`px-4 py-3 ${editingId === item.id ? 'bg-blue-50' : 'bg-white'} ${overId === item.id ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name || '(未命名)'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {item.year && <span>{item.year}</span>}
                        {item.sortOrder != null && <span>排序 {item.sortOrder}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editorMode && draft && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="mb-3 text-sm font-medium text-gray-700">
            {editorMode === 'add' ? '新增感恩項目' : '編輯感恩項目'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">名稱</label>
              <input
                type="text"
                value={draft.name || ''}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">年份</label>
              <input
                type="text"
                value={draft.year || ''}
                onChange={(event) => setDraft({ ...draft, year: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">排序順序</label>
              <input
                type="number"
                value={draft.sortOrder ?? ''}
                onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value ? Number(event.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">說明</label>
              <textarea
                value={draft.description || ''}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>先在上方列表點「編輯」再修改。可直接拖拉項目排序，系統會同步更新 sortOrder。</p>
      </div>
    </div>
  );
};

export default AdminThankYou;
