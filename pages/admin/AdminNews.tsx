import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, CalendarDays, Pin, Save } from 'lucide-react';
import { NewsItem } from '../../types';
import { getHomeNews } from '../../services/cmsLoader';
import { createNewsItem, updateNewsItem, deleteNewsItem } from '../../services/supabaseAdmin';
import { useToast } from '../../contexts/ToastContext';

type EditorMode = 'add' | 'edit' | null;

interface NewsFormProps {
  mode: Exclude<EditorMode, null>;
  draft: NewsItem;
  onChange: (next: NewsItem) => void;
  onCancel: () => void;
  onSave: () => void;
}

const NewsForm: React.FC<NewsFormProps> = ({ mode, draft, onChange, onCancel, onSave }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <div className="mb-3 text-sm font-medium text-gray-700">
      {mode === 'add' ? '新增消息' : '編輯消息'}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">日期</label>
        <input
          type="date"
          value={draft.date || ''}
          onChange={(event) => onChange({ ...draft, date: event.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">標題</label>
        <input
          type="text"
          value={draft.title || ''}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">描述</label>
        <textarea
          value={draft.description || ''}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">連結</label>
        <input
          type="url"
          value={draft.link || ''}
          onChange={(event) => onChange({ ...draft, link: event.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isNew || false}
            onChange={(event) => onChange({ ...draft, isNew: event.target.checked })}
            className="rounded"
          />
          <span className="text-sm">標記為新</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isPinned || false}
            onChange={(event) => onChange({ ...draft, isPinned: event.target.checked })}
            className="rounded"
          />
          <span className="text-sm">釘選</span>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          取消
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save size={16} />
          保存
        </button>
      </div>
    </div>
  </div>
);

const AdminNews: React.FC = () => {
  const { showToast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsItem | null>(null);

  useEffect(() => {
    void loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getHomeNews();
      setNews(data);
    } catch {
      showToast('載入最新消息失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditorMode('edit');
    setEditingId(item.id);
    setDraft({ ...item });
  };

  const startAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setDraft({
      id: '',
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      link: '',
      isNew: true,
      isPinned: false,
    });
  };

  const cancelEdit = () => {
    setEditorMode(null);
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft) return;

    if (!draft.title?.trim()) {
      showToast('請輸入標題', 'error');
      return;
    }

    const payload: Omit<NewsItem, 'id'> = {
      date: draft.date,
      title: draft.title,
      description: draft.description,
      link: draft.link,
      isNew: draft.isNew,
      isPinned: draft.isPinned,
    };

    try {
      if (editorMode === 'add') {
        await createNewsItem(payload);
        showToast('新消息已新增', 'success');
      } else if (editorMode === 'edit' && editingId) {
        await updateNewsItem(editingId, payload);
        showToast('消息已更新', 'success');
      }

      await loadNews();
      cancelEdit();
    } catch {
      showToast(editorMode === 'add' ? '新增失敗' : '更新失敗', 'error');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('確定要刪除此消息嗎？')) return;
    try {
      await deleteNewsItem(id);
      setNews((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      showToast('消息已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">最新消息</h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增消息
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">
          列表（依釘選 + 日期新到舊）
        </div>

        {news.length === 0 ? (
          <div className="p-8 text-center text-gray-600">尚無最新消息</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {news.map((item) => (
              <li key={item.id} className={`px-4 py-3 ${editingId === item.id ? 'bg-blue-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title || '(未命名)'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {item.date}
                      </span>
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Pin size={12} />
                          釘選
                        </span>
                      )}
                      {item.isNew && <span className="text-green-600">NEW</span>}
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
                      onClick={() => handleDeleteNews(item.id)}
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
        <NewsForm
          mode={editorMode}
          draft={draft}
          onChange={setDraft}
          onCancel={cancelEdit}
          onSave={handleSave}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>新增按鈕會先開啟欄位表單，保存後會重新整理列表。新增與編輯使用同一組欄位。</p>
      </div>
    </div>
  );
};

export default AdminNews;
